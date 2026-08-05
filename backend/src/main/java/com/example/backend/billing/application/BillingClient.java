package com.example.backend.billing.application;

import java.util.UUID;

public interface BillingClient {

	String createCustomer(UUID userId, String idempotencyKey);

	BillingService.CheckoutSession createCheckoutSession(String stripeCustomerId, String idempotencyKey);

	StripeSubscription retrieveSubscription(String stripeSubscriptionId);

	BillingService.PortalSession createCustomerPortalSession(String stripeCustomerId);

	record StripeSubscription(String id, String stripeCustomerId, String status, java.time.Instant currentPeriodEnd, boolean cancelAtPeriodEnd) {
	}
}
