package com.example.backend.ai.application;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiProviderBoundaryTests {

	private final AiProviderProperties properties = new AiProviderProperties(
			"https://openrouter.ai/api/v1",
			"sk-or-test",
			"deepseek/deepseek-v4-flash-0731",
			"openai/gpt-5.6-luna",
			Duration.ofSeconds(30),
			4096,
			new BigDecimal("0.10"),
			"2026-08-01"
	);

	@Test
	void selectsTheConfiguredCopilotAndReviewProfiles() {
		var boundary = new AiProviderBoundary(properties);

		assertEquals("deepseek/deepseek-v4-flash-0731", boundary.profile(AiProfile.COPILOT).model());
		assertEquals("openai/gpt-5.6-luna", boundary.profile(AiProfile.REVIEW).model());
	}

	@Test
	void everyRequestDisablesCollectionAndProviderFallback() {
		var request = new AiProviderBoundary(properties).request(AiProfile.COPILOT, "bounded user data");

		assertEquals("deepseek/deepseek-v4-flash-0731", request.model());
		assertEquals("deny", request.providerPolicy().dataCollection());
		assertFalse(request.providerPolicy().allowFallbacks());
		assertEquals("<untrusted-workspace-data>\nbounded user data\n</untrusted-workspace-data>",
				request.untrustedContext());
	}

	@Test
	void malformedConfigurationIsRejected() {
		assertThrows(IllegalArgumentException.class, () -> new AiProviderProperties(
				"http://openrouter.ai/api/v1", "", "", "openai/gpt-5.6-luna", Duration.ZERO, 0,
				new BigDecimal("0.11"), ""));
	}
}
