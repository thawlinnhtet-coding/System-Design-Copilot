package com.example.backend.ai.application;

public record AiProviderRequest(
		String model,
		int maxOutputTokens,
		ProviderRoutingPolicy providerPolicy,
		String systemInstruction,
		String untrustedContext
) {
}
