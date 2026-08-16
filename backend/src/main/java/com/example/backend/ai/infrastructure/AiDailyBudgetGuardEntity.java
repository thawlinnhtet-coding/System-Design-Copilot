package com.example.backend.ai.infrastructure;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A single durable row used to serialize the personal-beta global AI cap. */
@Entity
@Table(name = "ai_daily_budget_guard")
class AiDailyBudgetGuardEntity {

	@Id
	private Short id;

	protected AiDailyBudgetGuardEntity() {
	}
}
