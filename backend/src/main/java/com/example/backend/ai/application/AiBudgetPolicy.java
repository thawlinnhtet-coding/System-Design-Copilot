package com.example.backend.ai.application;

import java.math.BigDecimal;

public record AiBudgetPolicy(BigDecimal dailyCapUsd) {

	public void requireAvailable(BigDecimal spentTodayUsd, BigDecimal estimatedCostUsd) {
		if (spentTodayUsd == null || estimatedCostUsd == null || spentTodayUsd.signum() < 0 || estimatedCostUsd.signum() < 0
				|| spentTodayUsd.add(estimatedCostUsd).compareTo(dailyCapUsd) > 0) {
			throw new AiProviderExceptions.DailyBudgetExceededException();
		}
	}
}
