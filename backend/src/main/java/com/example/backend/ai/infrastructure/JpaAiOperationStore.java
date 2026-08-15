package com.example.backend.ai.infrastructure;

import com.example.backend.ai.application.AiOperation;
import com.example.backend.ai.application.AiOperationStore;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.Optional;

@Repository
class JpaAiOperationStore implements AiOperationStore {

	private final AiOperationRepository repository;

	JpaAiOperationStore(AiOperationRepository repository) {
		this.repository = repository;
	}

	@Override
	public BigDecimal chargedCostSince(Instant since) {
		return repository.chargedCostSince(since);
	}

	@Override
	public Optional<AiOperation> findById(UUID id) {
		return repository.findById(id).map(AiOperationEntity::toOperation);
	}

	@Override
	public AiOperation save(AiOperation operation) {
		return repository.save(new AiOperationEntity(operation)).toOperation();
	}
}
