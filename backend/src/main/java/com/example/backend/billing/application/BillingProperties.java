package com.example.backend.billing.application;

import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.billing")
public record BillingProperties(
		String stripeSecretKey,
		String stripeWebhookSecret,
		String proPriceId,
		String syntheticClerkSubject,
		boolean testProEnabled,
		String checkoutSuccessUrl,
		String checkoutCancelUrl,
		String portalReturnUrl,
		@Positive long checkoutCooldownSeconds,
		@Positive int pastDueGraceDays,
		@Positive long webhookToleranceSeconds
) {

	public boolean allowsSyntheticAccount(String clerkSubject) {
		if (!testProEnabled || clerkSubject == null || clerkSubject.isBlank()) {
			return false;
		}
		return syntheticClerkSubject == null
				|| syntheticClerkSubject.isBlank()
				|| syntheticClerkSubject.equals(clerkSubject);
	}

	public boolean usesStripeTestMode() {
		return stripeSecretKey != null && stripeSecretKey.startsWith("sk_test_");
	}
}
