package com.example.backend.billing.application;

import java.time.Instant;
import java.util.UUID;

public interface BillingPlanResolver {

	BillingPlan planFor(UUID userId, Instant now);

	record BillingPlan(
			boolean pro,
			Instant paidThrough,
			String status,
			boolean checkoutAvailable,
			boolean portalAvailable
	) {

		BillingPlan(boolean pro, Instant paidThrough) {
			this(pro, paidThrough, pro ? "PRO_ACTIVE" : "FREE_BETA", false, pro);
		}
	}
}
