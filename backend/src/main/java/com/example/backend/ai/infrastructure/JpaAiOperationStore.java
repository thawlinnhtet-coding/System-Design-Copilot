package com.example.backend.ai.infrastructure;

import com.example.backend.ai.application.AiOperation;

import com.example.backend.ai.application.AiBudgetPolicy;
import com.example.backend.ai.application.AiOperationStore;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.Optional;

@Repository
class JpaAiOperationStore implements AiOperationStore {

	private final AiOperationRepository repository;
	private final AiDailyBudgetGuardRepository dailyBudgetGuardRepository;

	JpaAiOperationStore(AiOperationRepository repository, AiDailyBudgetGuardRepository dailyBudgetGuardRepository) {
		this.repository = repository;
		this.dailyBudgetGuardRepository = dailyBudgetGuardRepository;
	}

	@Override
	public BigDecimal chargedCostSince(Instant since) {
		return repository.chargedCostSince(since);
	}

	@Override
	public void requireDailyBudgetAvailable(Instant startedAt, BigDecimal estimatedCostUsd, AiBudgetPolicy policy) {
		dailyBudgetGuardRepository.lockGlobalAiBudget();
		var startOfUtcDay = LocalDate.ofInstant(startedAt, ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant();
		policy.requireAvailable(repository.chargedCostSince(startOfUtcDay), estimatedCostUsd);
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
