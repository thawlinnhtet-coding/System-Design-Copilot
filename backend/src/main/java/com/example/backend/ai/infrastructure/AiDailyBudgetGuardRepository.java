package com.example.backend.ai.infrastructure;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

interface AiDailyBudgetGuardRepository extends JpaRepository<AiDailyBudgetGuardEntity, Short> {

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select guard from AiDailyBudgetGuardEntity guard where guard.id = 1")
	AiDailyBudgetGuardEntity lockGlobalAiBudget();
}
