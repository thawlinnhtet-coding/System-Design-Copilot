package com.example.backend.billing.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stripe_subscription_projections")
class StripeSubscriptionEntity {

	@Id
	@Column(name = "user_id")
	private UUID userId;

	@Column(name = "stripe_subscription_id", nullable = false, unique = true)
	private String stripeSubscriptionId;

	@Column(name = "stripe_customer_id", nullable = false)
	private String stripeCustomerId;

	@Column(nullable = false)
	private String status;

	@Column(name = "current_period_end")
	private Instant currentPeriodEnd;

	@Column(name = "past_due_at")
	private Instant pastDueAt;

	@Column(name = "last_event_created_at", nullable = false)
	private Instant lastEventCreatedAt;

	@Column(name = "last_event_id", nullable = false)
	private String lastEventId;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected StripeSubscriptionEntity() {
	}

	StripeSubscriptionEntity(UUID userId) {
		this.userId = userId;
	}

	UUID getUserId() { return userId; }
	String getStripeSubscriptionId() { return stripeSubscriptionId; }
	String getStripeCustomerId() { return stripeCustomerId; }
	String getStatus() { return status; }
	Instant getCurrentPeriodEnd() { return currentPeriodEnd; }
	Instant getPastDueAt() { return pastDueAt; }
	Instant getLastEventCreatedAt() { return lastEventCreatedAt; }
	String getLastEventId() { return lastEventId; }
	Instant getUpdatedAt() { return updatedAt; }

	void update(String stripeSubscriptionId, String stripeCustomerId, String status, Instant currentPeriodEnd,
			Instant pastDueAt, Instant lastEventCreatedAt, String lastEventId, Instant updatedAt) {
		this.stripeSubscriptionId = stripeSubscriptionId;
		this.stripeCustomerId = stripeCustomerId;
		this.status = status;
		this.currentPeriodEnd = currentPeriodEnd;
		this.pastDueAt = pastDueAt;
		this.lastEventCreatedAt = lastEventCreatedAt;
		this.lastEventId = lastEventId;
		this.updatedAt = updatedAt;
	}
}
