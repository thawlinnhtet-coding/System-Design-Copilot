package com.example.backend.billing.application;

import com.example.backend.identity.application.CurrentUserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
class DefaultBillingService implements BillingService, BillingPlanResolver {

	private final BillingClient billingClient;
	private final BillingProjectionStore projectionStore;
	private final StripeSignatureVerifier signatureVerifier;
	private final BillingProperties properties;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final Clock clock;

	DefaultBillingService(
			BillingClient billingClient,
			BillingProjectionStore projectionStore,
			StripeSignatureVerifier signatureVerifier,
			BillingProperties properties,
			Clock clock
	) {
		this.billingClient = billingClient;
		this.projectionStore = projectionStore;
		this.signatureVerifier = signatureVerifier;
		this.properties = properties;
		this.clock = clock;
	}

	@Override
	@Transactional
	public CheckoutSession startCheckout(CurrentUserService.CurrentUser user, String idempotencyKey) {
		if (!properties.usesStripeTestMode()) {
			throw new StripeTestModeRequiredException();
		}
		if (!properties.allowsSyntheticAccount(user.clerkSubject())) {
			throw new BillingAccessDeniedException();
		}
		if (planFor(user.id(), Instant.now(clock)).pro()) {
			throw new BillingAlreadyActiveException();
		}

		var customer = projectionStore.findCustomerByUserId(user.id())
				.orElseGet(() -> createCustomer(user));
		customer = projectionStore.findCustomerByUserIdForUpdate(user.id()).orElseThrow();
		var now = Instant.now(clock);
		if (customer.lastCheckoutAt() != null && now.isBefore(customer.lastCheckoutAt().plusSeconds(properties.checkoutCooldownSeconds()))) {
			throw new BillingRateLimitedException();
		}
		projectionStore.recordCheckoutStart(user.id(), now);
		return billingClient.createCheckoutSession(customer.stripeCustomerId(), idempotencyKey);
	}

	@Override
	@Transactional
	public PortalSession startCustomerPortal(CurrentUserService.CurrentUser user) {
		if (!properties.usesStripeTestMode()) {
			throw new StripeTestModeRequiredException();
		}
		if (!properties.allowsSyntheticAccount(user.clerkSubject()) || !planFor(user.id(), Instant.now(clock)).pro()) {
			throw new BillingAccessDeniedException();
		}
		var customer = projectionStore.findCustomerByUserId(user.id()).orElseThrow(BillingAccessDeniedException::new);
		return billingClient.createCustomerPortalSession(customer.stripeCustomerId());
	}

	@Override
	@Transactional
	public void reconcileCompletedCheckout(CurrentUserService.CurrentUser user, String stripeCheckoutSessionId) {
		if (!properties.usesStripeTestMode() || !properties.allowsSyntheticAccount(user.clerkSubject())) {
			throw new BillingAccessDeniedException();
		}
		if (stripeCheckoutSessionId == null || stripeCheckoutSessionId.isBlank() || stripeCheckoutSessionId.length() > 255) {
			throw new InvalidBillingRequestException();
		}
		var customer = projectionStore.findCustomerByUserIdForUpdate(user.id()).orElseThrow(BillingAccessDeniedException::new);
		var completion = billingClient.retrieveCheckoutCompletion(stripeCheckoutSessionId);
		if (!customer.stripeCustomerId().equals(completion.stripeCustomerId())
				|| (!"paid".equals(completion.paymentStatus()) && !"no_payment_required".equals(completion.paymentStatus()))) {
			throw new BillingAccessDeniedException();
		}
		var subscription = billingClient.retrieveSubscription(completion.stripeSubscriptionId());
		if (!customer.stripeCustomerId().equals(subscription.stripeCustomerId())) {
			throw new BillingAccessDeniedException();
		}
		var now = Instant.now(clock);
		var status = subscription.cancelAtPeriodEnd() ? "canceled" : subscription.status();
		projectionStore.saveSubscription(new BillingProjectionStore.Subscription(
				user.id(), subscription.id(), subscription.stripeCustomerId(), status, subscription.currentPeriodEnd(),
				"past_due".equals(status) ? now : null, now, "checkout-" + stripeCheckoutSessionId, now));
	}

	@Override
	@Transactional
	public void processWebhook(byte[] rawBody, String stripeSignature) {
		// Stripe signs the exact bytes received, so authentication must precede JSON parsing.
		if (!properties.usesStripeTestMode()) {
			throw new StripeTestModeRequiredException();
		}
		if (!signatureVerifier.isValid(rawBody, stripeSignature)) {
			throw new InvalidStripeSignatureException();
		}

		var event = parseEvent(rawBody);
		if (event.liveMode()) {
			throw new InvalidStripeWebhookException();
		}
		if (!event.isBillingEvent()) {
			return;
		}

		var checkoutCompletion = event.checkoutSessionId() == null ? null : billingClient.retrieveCheckoutCompletion(event.checkoutSessionId());
		if (checkoutCompletion != null && !"paid".equals(checkoutCompletion.paymentStatus()) && !"no_payment_required".equals(checkoutCompletion.paymentStatus())) {
			return;
		}
		var subscription = checkoutCompletion == null ? event.subscription() : billingClient.retrieveSubscription(checkoutCompletion.stripeSubscriptionId());
		var customerId = checkoutCompletion == null ? subscription.stripeCustomerId() : checkoutCompletion.stripeCustomerId();
		if (!subscription.stripeCustomerId().equals(customerId)) {
			throw new InvalidStripeWebhookException();
		}
		var customer = projectionStore.findCustomerByStripeCustomerIdForUpdate(customerId);
		if (customer.isEmpty() || !properties.allowsSyntheticAccount(customer.get().clerkSubject())) {
			return;
		}
		if (!projectionStore.recordWebhookReceipt(new BillingProjectionStore.WebhookReceipt(
				event.id(), event.type(), event.createdAt(), Instant.now(clock)))) {
			return;
		}

		var existing = projectionStore.findSubscriptionByUserIdForUpdate(customer.get().userId());
		var reconciliationRequired = existing.isPresent() && !event.createdAt().isAfter(existing.get().lastEventCreatedAt());
		if (reconciliationRequired && !existing.get().stripeSubscriptionId().equals(subscription.id())) {
			return;
		}
		var subscriptionToProject = reconciliationRequired ? billingClient.retrieveSubscription(subscription.id()) : subscription;
		var status = !reconciliationRequired && event.type().equals("customer.subscription.deleted")
				? "canceled"
				: subscriptionToProject.cancelAtPeriodEnd() ? "canceled" : subscriptionToProject.status();
		var pastDueAt = "past_due".equals(status)
				? existing.filter(value -> "past_due".equals(value.status())).map(BillingProjectionStore.Subscription::pastDueAt).orElse(event.createdAt())
				: null;
		var lastEventCreatedAt = reconciliationRequired ? existing.get().lastEventCreatedAt() : event.createdAt();
		var lastEventId = reconciliationRequired ? existing.get().lastEventId() : event.id();
		projectionStore.saveSubscription(new BillingProjectionStore.Subscription(
				customer.get().userId(), subscriptionToProject.id(), subscriptionToProject.stripeCustomerId(), status,
				subscriptionToProject.currentPeriodEnd(), pastDueAt, lastEventCreatedAt, lastEventId, Instant.now(clock)));
	}

	@Override
	@Transactional(readOnly = true)
	public BillingPlan planFor(UUID userId, Instant now) {
		var customer = projectionStore.findCustomerByUserId(userId);
		if (customer.isEmpty() || !properties.allowsSyntheticAccount(customer.get().clerkSubject())) {
			return new BillingPlan(false, null, "FREE_BETA", false, false);
		}
		var subscription = projectionStore.findSubscriptionByUserId(userId);
		if (subscription.isEmpty()) {
			return new BillingPlan(false, null, "FREE_TEST_MODE", true, false);
		}
		var value = subscription.get();
		return switch (value.status()) {
			case "active", "trialing" -> new BillingPlan(true, value.currentPeriodEnd(), "PRO_ACTIVE", false, true);
			case "past_due" -> {
				var graceEndsAt = value.pastDueAt() == null ? null : value.pastDueAt().plusSeconds(properties.pastDueGraceDays() * 86_400L);
				yield new BillingPlan(graceEndsAt != null && now.isBefore(graceEndsAt), graceEndsAt,
						graceEndsAt != null && now.isBefore(graceEndsAt) ? "PRO_PAST_DUE" : "FREE_PAST_DUE", false,
						false);
			}
			case "canceled" -> {
				var pro = value.currentPeriodEnd() != null && now.isBefore(value.currentPeriodEnd());
				yield new BillingPlan(pro, value.currentPeriodEnd(), pro ? "PRO_CANCELING" : "FREE_TEST_MODE", false, pro);
			}
			default -> new BillingPlan(false, null, "FREE_TEST_MODE", true, false);
		};
	}

	private BillingProjectionStore.Customer createCustomer(CurrentUserService.CurrentUser user) {
		var stripeCustomerId = billingClient.createCustomer(user.id(), "customer-" + user.id());
		var customer = new BillingProjectionStore.Customer(user.id(), user.clerkSubject(), stripeCustomerId, Instant.now(clock), null);
		projectionStore.saveCustomer(customer);
		return customer;
	}

	private StripeEvent parseEvent(byte[] rawBody) {
		try {
			var root = objectMapper.readTree(rawBody);
			if (!root.path("livemode").isBoolean()) {
				throw new InvalidStripeWebhookException();
			}
			var id = text(root, "id");
			var type = text(root, "type");
			var liveMode = root.path("livemode").asBoolean();
			var createdAt = Instant.ofEpochSecond(root.path("created").asLong(-1));
			if (createdAt.equals(Instant.ofEpochSecond(-1))) {
				throw new InvalidStripeWebhookException();
			}
			if ("checkout.session.completed".equals(type)) {
				return new StripeEvent(id, type, createdAt, liveMode, null, text(root.path("data").path("object"), "id"));
			}
			if (!type.startsWith("customer.subscription.")) {
				return new StripeEvent(id, type, createdAt, liveMode, null, null);
			}
			var object = root.path("data").path("object");
			var periodEndSeconds = object.path("current_period_end").asLong(-1);
			var periodEnd = periodEndSeconds < 0 ? null : Instant.ofEpochSecond(periodEndSeconds);
			return new StripeEvent(id, type, createdAt, liveMode, new BillingClient.StripeSubscription(
					text(object, "id"), text(object, "customer"), text(object, "status").toLowerCase(Locale.ROOT), periodEnd,
					object.path("cancel_at_period_end").asBoolean(false)), null);
		} catch (InvalidStripeWebhookException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new InvalidStripeWebhookException();
		}
	}

	private String text(JsonNode node, String field) {
		var value = node.path(field).asText();
		if (value.isBlank()) {
			throw new InvalidStripeWebhookException();
		}
		return value;
	}

	private record StripeEvent(String id, String type, Instant createdAt, boolean liveMode, BillingClient.StripeSubscription subscription, String checkoutSessionId) {
		boolean isBillingEvent() {
			return subscription != null || checkoutSessionId != null;
		}
	}

}
