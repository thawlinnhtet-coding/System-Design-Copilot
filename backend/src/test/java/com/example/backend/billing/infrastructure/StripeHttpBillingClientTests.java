package com.example.backend.billing.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StripeHttpBillingClientTests {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void readsThePeriodEndFromTheSubscriptionItemWhenStripeOmitsTheLegacyTopLevelField() throws Exception {
		var subscription = objectMapper.readTree("""
				{"items":{"data":[{"current_period_end":1780000000}]}}
				""");

		assertEquals(1_780_000_000L, StripeHttpBillingClient.currentPeriodEndSeconds(subscription));
	}
}
