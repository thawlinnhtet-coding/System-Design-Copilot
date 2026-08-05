package com.example.backend.billing.application;

class BillingAccessDeniedException extends RuntimeException {
	BillingAccessDeniedException() {
		super("Billing is available only to the configured synthetic test account");
	}
}

class StripeTestModeRequiredException extends RuntimeException {
	StripeTestModeRequiredException() {
		super("Stripe Checkout is restricted to test mode");
	}
}

class BillingAlreadyActiveException extends RuntimeException {
BillingAlreadyActiveException() {
		super("An active Pro subscription must be managed through the Stripe Customer Portal");
	}
}

class BillingRateLimitedException extends RuntimeException {
	BillingRateLimitedException() {
		super("Wait before starting another Stripe Checkout session");
	}
}

class InvalidStripeSignatureException extends RuntimeException {
	InvalidStripeSignatureException() {
		super("Stripe webhook signature is invalid");
	}
}

class InvalidStripeWebhookException extends RuntimeException {
	InvalidStripeWebhookException() {
		super("Stripe webhook payload is invalid");
	}
}
