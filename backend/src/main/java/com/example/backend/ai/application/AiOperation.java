package com.example.backend.ai.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AiOperation(
		UUID id,
		UUID userId,
		UUID workspaceId,
		AiProfile profile,
		AiOperationStatus status,
		String model,
		String providerRequestId,
		String promptVersion,
		Integer inputTokens,
		Integer outputTokens,
		Integer totalTokens,
		BigDecimal estimatedCostUsd,
		BigDecimal chargedCostUsd,
		Long latencyMs,
		String outcomeCode,
		String acceptedOutput,
		Instant createdAt,
		Instant completedAt
) {
}
