package com.example.backend.billing.application;

import java.time.Instant;
import java.util.UUID;

public interface BillingPlanResolver {

	BillingPlan planFor(UUID userId, Instant now);

	record BillingPlan(boolean pro, Instant paidThrough) {
	}
}
