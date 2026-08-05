package com.example.backend.billing.application;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class BillingProblemAdvice {

	@ExceptionHandler(BillingAccessDeniedException.class)
	ProblemDetail billingAccessDenied(BillingAccessDeniedException exception) {
		return problem(HttpStatus.FORBIDDEN, "Billing access denied", exception.getMessage(), "billing-access-denied", "billing_access_denied");
	}

	@ExceptionHandler(StripeTestModeRequiredException.class)
	ProblemDetail stripeTestModeRequired(StripeTestModeRequiredException exception) {
		return problem(HttpStatus.FORBIDDEN, "Stripe test mode required", exception.getMessage(), "stripe-test-mode-required", "stripe_test_mode_required");
	}

	@ExceptionHandler(BillingAlreadyActiveException.class)
	ProblemDetail billingAlreadyActive(BillingAlreadyActiveException exception) {
		return problem(HttpStatus.CONFLICT, "Pro subscription already active", exception.getMessage(), "billing-already-active", "billing_already_active");
	}

	@ExceptionHandler(BillingRateLimitedException.class)
	ProblemDetail billingRateLimited(BillingRateLimitedException exception) {
		return problem(HttpStatus.TOO_MANY_REQUESTS, "Checkout rate limited", exception.getMessage(), "billing-rate-limited", "billing_rate_limited");
	}

	@ExceptionHandler({InvalidStripeSignatureException.class, InvalidStripeWebhookException.class})
	ProblemDetail invalidStripeWebhook(RuntimeException exception) {
		return problem(HttpStatus.BAD_REQUEST, "Invalid Stripe webhook", exception.getMessage(), "stripe-webhook-invalid", "stripe_webhook_invalid");
	}

	@ExceptionHandler(InvalidBillingRequestException.class)
	ProblemDetail invalidBillingRequest(InvalidBillingRequestException exception) {
		return problem(HttpStatus.BAD_REQUEST, "Invalid billing request", exception.getMessage(), "billing-request-invalid", "billing_request_invalid");
	}

	@ExceptionHandler(BillingProviderException.class)
	ProblemDetail billingProviderUnavailable(BillingProviderException exception) {
		return problem(HttpStatus.BAD_GATEWAY, "Billing provider unavailable", exception.getMessage(), "billing-provider-unavailable", "billing_provider_unavailable");
	}

	private ProblemDetail problem(HttpStatus status, String title, String detail, String type, String code) {
		var problem = ProblemDetail.forStatusAndDetail(status, detail);
		problem.setTitle(title);
		problem.setType(URI.create("https://system-design-copilot.dev/problems/" + type));
		problem.setProperty("code", code);
		return problem;
	}
}
