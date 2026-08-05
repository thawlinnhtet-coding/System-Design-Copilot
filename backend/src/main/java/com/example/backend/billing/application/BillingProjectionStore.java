package com.example.backend.billing.application;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface BillingProjectionStore {

	Optional<Customer> findCustomerByUserId(UUID userId);

	Optional<Customer> findCustomerByUserIdForUpdate(UUID userId);

	Optional<Customer> findCustomerByStripeCustomerId(String stripeCustomerId);

	Optional<Customer> findCustomerByStripeCustomerIdForUpdate(String stripeCustomerId);

	void saveCustomer(Customer customer);

	void recordCheckoutStart(UUID userId, Instant startedAt);

	boolean recordWebhookReceipt(WebhookReceipt receipt);

	Optional<Subscription> findSubscriptionByUserIdForUpdate(UUID userId);

	Optional<Subscription> findSubscriptionByUserId(UUID userId);

	void saveSubscription(Subscription subscription);

	record Customer(UUID userId, String clerkSubject, String stripeCustomerId, Instant createdAt, Instant lastCheckoutAt) {
	}

	record Subscription(
			UUID userId,
			String stripeSubscriptionId,
			String stripeCustomerId,
			String status,
			Instant currentPeriodEnd,
			Instant pastDueAt,
			Instant lastEventCreatedAt,
			String lastEventId,
			Instant updatedAt
	) {
	}

	record WebhookReceipt(String stripeEventId, String eventType, Instant eventCreatedAt, Instant receivedAt) {
	}
}
