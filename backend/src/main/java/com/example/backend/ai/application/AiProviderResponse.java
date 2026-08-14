package com.example.backend.ai.application;

import java.math.BigDecimal;

public record AiProviderResponse(
		String content,
		String providerRequestId,
		String model,
		Integer inputTokens,
		Integer outputTokens,
		BigDecimal costUsd
) {

	public AiProviderResponse(String content, String providerRequestId, String model) {
		this(content, providerRequestId, model, null, null, null);
	}
}
