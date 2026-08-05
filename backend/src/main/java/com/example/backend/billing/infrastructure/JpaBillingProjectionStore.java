package com.example.backend.billing.infrastructure;

import com.example.backend.billing.application.BillingProjectionStore;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
class JpaBillingProjectionStore implements BillingProjectionStore {

	private final BillingCustomerRepository customerRepository;
	private final StripeSubscriptionRepository subscriptionRepository;
	private final StripeWebhookReceiptRepository receiptRepository;

	JpaBillingProjectionStore(BillingCustomerRepository customerRepository, StripeSubscriptionRepository subscriptionRepository,
			StripeWebhookReceiptRepository receiptRepository) {
		this.customerRepository = customerRepository;
		this.subscriptionRepository = subscriptionRepository;
		this.receiptRepository = receiptRepository;
	}

	@Override
	public Optional<Customer> findCustomerByUserId(UUID userId) {
		return customerRepository.findById(userId).map(this::customer);
	}

	@Override
	public Optional<Customer> findCustomerByUserIdForUpdate(UUID userId) {
		return customerRepository.findByUserIdForUpdate(userId).map(this::customer);
	}

	@Override
	public Optional<Customer> findCustomerByStripeCustomerId(String stripeCustomerId) {
		return customerRepository.findByStripeCustomerId(stripeCustomerId).map(this::customer);
	}

	@Override
	public Optional<Customer> findCustomerByStripeCustomerIdForUpdate(String stripeCustomerId) {
		return customerRepository.findByStripeCustomerIdForUpdate(stripeCustomerId).map(this::customer);
	}

	@Override
	public void saveCustomer(Customer customer) {
		customerRepository.save(new BillingCustomerEntity(customer.userId(), customer.clerkSubject(), customer.stripeCustomerId(), customer.createdAt()));
	}

	@Override
	public void recordCheckoutStart(UUID userId, java.time.Instant startedAt) {
		customerRepository.findById(userId).orElseThrow().setLastCheckoutAt(startedAt);
	}

	@Override
	public boolean recordWebhookReceipt(WebhookReceipt receipt) {
		if (receiptRepository.existsById(receipt.stripeEventId())) {
			return false;
		}
		receiptRepository.save(new StripeWebhookReceiptEntity(receipt.stripeEventId(), receipt.eventType(), receipt.eventCreatedAt(), receipt.receivedAt()));
		return true;
	}

	@Override
	public Optional<Subscription> findSubscriptionByUserIdForUpdate(UUID userId) {
		return subscriptionRepository.findByUserIdForUpdate(userId).map(this::subscription);
	}

	@Override
	public Optional<Subscription> findSubscriptionByUserId(UUID userId) {
		return subscriptionRepository.findById(userId).map(this::subscription);
	}

	@Override
	public void saveSubscription(Subscription subscription) {
		var entity = subscriptionRepository.findById(subscription.userId())
				.orElseGet(() -> new StripeSubscriptionEntity(subscription.userId()));
		entity.update(subscription.stripeSubscriptionId(), subscription.stripeCustomerId(), subscription.status(),
				subscription.currentPeriodEnd(), subscription.pastDueAt(), subscription.lastEventCreatedAt(), subscription.lastEventId(), subscription.updatedAt());
		subscriptionRepository.save(entity);
	}

	private Customer customer(BillingCustomerEntity entity) {
		return new Customer(entity.getUserId(), entity.getClerkSubject(), entity.getStripeCustomerId(), entity.getCreatedAt(), entity.getLastCheckoutAt());
	}

	private Subscription subscription(StripeSubscriptionEntity entity) {
		return new Subscription(entity.getUserId(), entity.getStripeSubscriptionId(), entity.getStripeCustomerId(), entity.getStatus(),
				entity.getCurrentPeriodEnd(), entity.getPastDueAt(), entity.getLastEventCreatedAt(), entity.getLastEventId(), entity.getUpdatedAt());
	}
}
