package com.example.backend.billing.application;

import com.example.backend.identity.application.CurrentUserService;

public interface BillingService {

	CheckoutSession startCheckout(CurrentUserService.CurrentUser user, String idempotencyKey);

	PortalSession startCustomerPortal(CurrentUserService.CurrentUser user);

	void reconcileCompletedCheckout(CurrentUserService.CurrentUser user, String stripeCheckoutSessionId);

	void processWebhook(byte[] rawBody, String stripeSignature);

	record CheckoutSession(String id, String url) {
	}

	record PortalSession(String url) {
	}
}
