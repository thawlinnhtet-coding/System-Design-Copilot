package com.example.backend.billing.application;

import com.example.backend.identity.application.CurrentUserService;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BillingServiceTests {

	private static final Instant NOW = Instant.parse("2026-08-05T12:00:00Z");
	private static final String WEBHOOK_SECRET = "whsec_test_webhook_secret";

	@Test
	void ignoresDuplicateAndOlderSubscriptionEventsWithoutRegressingTheProjection() {
		var store = new InMemoryStore();
		var userId = UUID.randomUUID();
		store.saveCustomer(new BillingProjectionStore.Customer(userId, "synthetic_test_user", "cus_test", NOW, null));
		var service = service(store, "synthetic_test_user");

		var newEvent = event("evt_new", "customer.subscription.updated", NOW.plusSeconds(20), "active", NOW.plusSeconds(2_592_000));
		var duplicateEvent = event("evt_new", "customer.subscription.updated", NOW.plusSeconds(20), "canceled", NOW);
		var oldEvent = event("evt_old", "customer.subscription.deleted", NOW.plusSeconds(10), "canceled", NOW);
		service.processWebhook(newEvent, signedHeader(newEvent));
		service.processWebhook(duplicateEvent, signedHeader(duplicateEvent));
		service.processWebhook(oldEvent, signedHeader(oldEvent));

		var projection = store.findSubscriptionByUserId(userId).orElseThrow();
		assertEquals("active", projection.status());
		assertEquals("evt_new", projection.lastEventId());
		assertEquals(2, store.receiptCount());
		assertTrue(service.planFor(userId, NOW).pro());
	}

	@Test
	void appliesPastDueGraceAndKeepsUnknownOrNonSyntheticCustomersFree() {
		var store = new InMemoryStore();
		var userId = UUID.randomUUID();
		store.saveCustomer(new BillingProjectionStore.Customer(userId, "synthetic_test_user", "cus_test", NOW, null));
		var service = service(store, "synthetic_test_user");

		var pastDueEvent = event("evt_past_due", "customer.subscription.updated", NOW, "past_due", NOW.plusSeconds(2_592_000));
		service.processWebhook(pastDueEvent, signedHeader(pastDueEvent));

		assertTrue(service.planFor(userId, NOW.plusSeconds(6 * 86_400L)).pro());
		assertFalse(service.planFor(userId, NOW.plusSeconds(7 * 86_400L)).pro());

		var blockedStore = new InMemoryStore();
		var blockedUser = UUID.randomUUID();
		blockedStore.saveCustomer(new BillingProjectionStore.Customer(blockedUser, "other_user", "cus_test", NOW, null));
		var blockedEvent = event("evt_blocked", "customer.subscription.updated", NOW, "active", NOW.plusSeconds(2_592_000));
		service(blockedStore, "synthetic_test_user").processWebhook(blockedEvent, signedHeader(blockedEvent));
		assertTrue(blockedStore.findSubscriptionByUserId(blockedUser).isEmpty());
	}

	@Test
	void rejectsCheckoutWhenNoSyntheticSubjectIsConfigured() {
		var store = new InMemoryStore();
		var service = service(store, "");
		var user = new CurrentUserService.CurrentUser(UUID.randomUUID(), "personal_beta_user");

		assertThrows(BillingAccessDeniedException.class, () -> service.startCheckout(user, "checkout-key"));
	}

	@Test
	void exposesCheckoutForAnEligibleTestUserBeforeTheStripeCustomerExists() {
		var store = new InMemoryStore();
		var user = new CurrentUserService.CurrentUser(UUID.randomUUID(), "personal_beta_user");

		var plan = service(store, user.clerkSubject()).planFor(user, NOW);

		assertEquals("FREE_TEST_MODE", plan.status());
		assertTrue(plan.checkoutAvailable());
		assertFalse(plan.portalAvailable());
	}

	@Test
	void keepsAnExistingTestSubscriptionBlockedWhenSyntheticAccountIsNotConfigured() {
		var store = new InMemoryStore();
		var userId = UUID.randomUUID();
		store.saveCustomer(new BillingProjectionStore.Customer(userId, "synthetic_test_user", "cus_test", NOW, null));
		var webhook = event("evt_active", "customer.subscription.updated", NOW, "active", NOW.plusSeconds(2_592_000));
		service(store, "synthetic_test_user").processWebhook(webhook, signedHeader(webhook));

		assertFalse(service(store, "").planFor(userId, NOW).pro());
	}

	@Test
	void rejectsLiveModeEventsBeforeTheyCanGrantTestPro() {
		var store = new InMemoryStore();
		var userId = UUID.randomUUID();
		store.saveCustomer(new BillingProjectionStore.Customer(userId, "synthetic_test_user", "cus_test", NOW, null));
		var webhook = event("evt_live", "customer.subscription.updated", NOW, "active", NOW.plusSeconds(2_592_000), true);

		assertThrows(InvalidStripeWebhookException.class, () -> service(store, "synthetic_test_user").processWebhook(webhook, signedHeader(webhook)));
		assertTrue(store.findSubscriptionByUserId(userId).isEmpty());
	}

	@Test
	void reconcilesSameSecondSubscriptionEventsWithTheCurrentStripeState() {
		var store = new InMemoryStore();
		var userId = UUID.randomUUID();
		store.saveCustomer(new BillingProjectionStore.Customer(userId, "synthetic_test_user", "cus_test", NOW, null));
		var service = service(store, "synthetic_test_user", new FakeBillingClient(
				new BillingClient.StripeSubscription("sub_test", "cus_test", "past_due", NOW.plusSeconds(2_592_000), false)));
		var initial = event("evt_active", "customer.subscription.updated", NOW, "active", NOW.plusSeconds(2_592_000));
		var tied = event("evt_tied", "customer.subscription.deleted", NOW, "canceled", NOW);

		service.processWebhook(initial, signedHeader(initial));
		service.processWebhook(tied, signedHeader(tied));

		assertEquals("past_due", store.findSubscriptionByUserId(userId).orElseThrow().status());
	}

	@Test
	void directsAnAlreadyProUserAwayFromAnotherCheckout() {
		var store = new InMemoryStore();
		var userId = UUID.randomUUID();
		store.saveCustomer(new BillingProjectionStore.Customer(userId, "synthetic_test_user", "cus_test", NOW, null));
		store.saveSubscription(new BillingProjectionStore.Subscription(userId, "sub_test", "cus_test", "active", NOW.plusSeconds(2_592_000), null, NOW, "evt_active", NOW));

		assertThrows(BillingAlreadyActiveException.class,
				() -> service(store, "synthetic_test_user").startCheckout(new CurrentUserService.CurrentUser(userId, "synthetic_test_user"), "checkout-key"));
	}

	@Test
	void exposesCancellationAsProUntilThePaidThroughDate() {
		var store = new InMemoryStore();
		var userId = UUID.randomUUID();
		var paidThrough = NOW.plusSeconds(2_592_000);
		store.saveCustomer(new BillingProjectionStore.Customer(userId, "synthetic_test_user", "cus_test", NOW, null));
		store.saveSubscription(new BillingProjectionStore.Subscription(userId, "sub_test", "cus_test", "canceled", paidThrough, null, NOW, "evt_canceled", NOW));

		var plan = service(store, "synthetic_test_user").planFor(userId, NOW);

		assertTrue(plan.pro());
		assertEquals("PRO_CANCELING", plan.status());
		assertEquals(paidThrough, plan.paidThrough());
		assertTrue(plan.portalAvailable());
	}

	@Test
	void projectsProFromAVerifiedCompletedCheckoutWhenTheSubscriptionEventIsDelayed() {
		var store = new InMemoryStore();
		var userId = UUID.randomUUID();
		store.saveCustomer(new BillingProjectionStore.Customer(userId, "synthetic_test_user", "cus_test", NOW, null));
		var service = service(store, "synthetic_test_user");
		var checkout = checkoutCompletedEvent("evt_checkout", NOW);

		service.processWebhook(checkout, signedHeader(checkout));

		assertTrue(service.planFor(userId, NOW).pro());
		assertEquals("active", store.findSubscriptionByUserId(userId).orElseThrow().status());
	}

	private DefaultBillingService service(InMemoryStore store, String syntheticSubject) {
		return service(store, syntheticSubject, new FakeBillingClient());
	}

	private DefaultBillingService service(InMemoryStore store, String syntheticSubject, BillingClient billingClient) {
		var properties = new BillingProperties("sk_test_placeholder", WEBHOOK_SECRET, "price_test", syntheticSubject, true,
				"http://localhost/success", "http://localhost/cancel", "http://localhost/billing", 60, 7, 300);
		var clock = Clock.fixed(NOW, ZoneOffset.UTC);
		return new DefaultBillingService(billingClient, store, new StripeSignatureVerifier(properties, clock), properties, clock);
	}

	private byte[] event(String eventId, String type, Instant eventCreatedAt, String status, Instant periodEnd) {
		return event(eventId, type, eventCreatedAt, status, periodEnd, false);
	}

	private byte[] event(String eventId, String type, Instant eventCreatedAt, String status, Instant periodEnd, boolean liveMode) {
		return ("{\"id\":\"" + eventId + "\",\"type\":\"" + type + "\",\"created\":" + eventCreatedAt.getEpochSecond()
				+ ",\"livemode\":" + liveMode + ",\"data\":{\"object\":{\"id\":\"sub_test\",\"customer\":\"cus_test\",\"status\":\"" + status
				+ "\",\"current_period_end\":" + periodEnd.getEpochSecond() + "}}}").getBytes(StandardCharsets.UTF_8);
	}

	private byte[] checkoutCompletedEvent(String eventId, Instant eventCreatedAt) {
		return ("{\"id\":\"" + eventId + "\",\"type\":\"checkout.session.completed\",\"created\":" + eventCreatedAt.getEpochSecond()
				+ ",\"livemode\":false,\"data\":{\"object\":{\"id\":\"cs_test\"}}}").getBytes(StandardCharsets.UTF_8);
	}

	private String signedHeader(byte[] payload) {
		var timestamp = NOW.getEpochSecond();
		return "t=" + timestamp + ",v1=" + hmac(timestamp + "." + new String(payload, StandardCharsets.UTF_8));
	}

	private String hmac(String value) {
		try {
			var mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			return java.util.HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
		} catch (Exception exception) {
			throw new IllegalStateException(exception);
		}
	}

	private final class FakeBillingClient implements BillingClient {
		private final BillingClient.StripeSubscription currentSubscription;

		FakeBillingClient() {
			this(new BillingClient.StripeSubscription("sub_test", "cus_test", "active", NOW.plusSeconds(2_592_000), false));
		}

		FakeBillingClient(BillingClient.StripeSubscription currentSubscription) {
			this.currentSubscription = currentSubscription;
		}

		@Override
		public String createCustomer(UUID userId, String idempotencyKey) {
			return "cus_test";
		}

		@Override
		public BillingService.CheckoutSession createCheckoutSession(String stripeCustomerId, String idempotencyKey) {
			return new BillingService.CheckoutSession("cs_test", "https://checkout.stripe.test/cs_test");
		}

		@Override
		public BillingClient.StripeSubscription retrieveSubscription(String stripeSubscriptionId) {
			return currentSubscription;
		}

		@Override
		public BillingClient.CheckoutCompletion retrieveCheckoutCompletion(String stripeCheckoutSessionId) {
			return new BillingClient.CheckoutCompletion("cus_test", "sub_test", "paid");
		}

		@Override
		public BillingService.PortalSession createCustomerPortalSession(String stripeCustomerId) {
			return new BillingService.PortalSession("https://billing.stripe.test/portal");
		}
	}

	private static final class InMemoryStore implements BillingProjectionStore {
		private final HashMap<UUID, Customer> customers = new HashMap<>();
		private final HashMap<UUID, Subscription> subscriptions = new HashMap<>();
		private final Set<String> receipts = new HashSet<>();

		@Override public Optional<Customer> findCustomerByUserId(UUID userId) { return Optional.ofNullable(customers.get(userId)); }
		@Override public Optional<Customer> findCustomerByUserIdForUpdate(UUID userId) { return findCustomerByUserId(userId); }
		@Override public Optional<Customer> findCustomerByStripeCustomerId(String stripeCustomerId) { return customers.values().stream().filter(value -> value.stripeCustomerId().equals(stripeCustomerId)).findFirst(); }
		@Override public Optional<Customer> findCustomerByStripeCustomerIdForUpdate(String stripeCustomerId) { return findCustomerByStripeCustomerId(stripeCustomerId); }
		@Override public void saveCustomer(Customer customer) { customers.put(customer.userId(), customer); }
		@Override public void recordCheckoutStart(UUID userId, Instant startedAt) { var customer = customers.get(userId); customers.put(userId, new Customer(customer.userId(), customer.clerkSubject(), customer.stripeCustomerId(), customer.createdAt(), startedAt)); }
		@Override public boolean recordWebhookReceipt(WebhookReceipt receipt) { return receipts.add(receipt.stripeEventId()); }
		@Override public Optional<Subscription> findSubscriptionByUserIdForUpdate(UUID userId) { return findSubscriptionByUserId(userId); }
		@Override public Optional<Subscription> findSubscriptionByUserId(UUID userId) { return Optional.ofNullable(subscriptions.get(userId)); }
		@Override public void saveSubscription(Subscription subscription) { subscriptions.put(subscription.userId(), subscription); }
		int receiptCount() { return receipts.size(); }
	}
}
