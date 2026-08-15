package com.example.backend.ai.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.Optional;

public interface AiOperationStore {

	BigDecimal chargedCostSince(Instant since);

	Optional<AiOperation> findById(UUID id);

	AiOperation save(AiOperation operation);
}
