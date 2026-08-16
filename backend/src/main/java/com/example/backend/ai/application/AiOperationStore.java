package com.example.backend.ai.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.Optional;

public interface AiOperationStore {

	BigDecimal chargedCostSince(Instant since);

	/**
	 * Serializes global budget admission with persistence of the accepted or failed
	 * operation record. The supplied policy is evaluated while the database-backed
	 * guard is held, so concurrent AI operations cannot over-admit the UTC cap.
	 */
	void requireDailyBudgetAvailable(Instant startedAt, BigDecimal estimatedCostUsd, AiBudgetPolicy policy);

	Optional<AiOperation> findById(UUID id);

	AiOperation save(AiOperation operation);
}
