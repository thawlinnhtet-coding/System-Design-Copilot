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
		boolean allowAllTestUsers,
		String checkoutSuccessUrl,
		String checkoutCancelUrl,
		String portalReturnUrl,
		@Positive long checkoutCooldownSeconds,
		@Positive int pastDueGraceDays,
		@Positive long webhookToleranceSeconds
) {

	public boolean allowsSyntheticAccount(String clerkSubject) {
		if (!testProEnabled || !usesStripeTestMode() || clerkSubject == null || clerkSubject.isBlank()) {
			return false;
		}
		if (allowAllTestUsers) {
			return true;
		}
		if (syntheticClerkSubject == null || syntheticClerkSubject.isBlank()) {
			return false;
		}
		return syntheticClerkSubject.equals(clerkSubject);
	}

	public boolean usesStripeTestMode() {
		return stripeSecretKey != null && stripeSecretKey.startsWith("sk_test_");
	}
}
