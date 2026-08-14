package com.example.backend.ai.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface AiOperationStore {

	BigDecimal chargedCostSince(Instant since);

	AiOperation save(AiOperation operation);
}
