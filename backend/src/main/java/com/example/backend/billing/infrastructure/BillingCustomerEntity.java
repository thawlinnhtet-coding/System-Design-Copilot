package com.example.backend.billing.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "billing_customers")
class BillingCustomerEntity {

	@Id
	@Column(name = "user_id")
	private UUID userId;

	@Column(name = "clerk_subject", nullable = false, updatable = false)
	private String clerkSubject;

	@Column(name = "stripe_customer_id", nullable = false, unique = true, updatable = false)
	private String stripeCustomerId;

	@Column(name = "last_checkout_at")
	private Instant lastCheckoutAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected BillingCustomerEntity() {
	}

	BillingCustomerEntity(UUID userId, String clerkSubject, String stripeCustomerId, Instant createdAt) {
		this.userId = userId;
		this.clerkSubject = clerkSubject;
		this.stripeCustomerId = stripeCustomerId;
		this.createdAt = createdAt;
	}

	UUID getUserId() { return userId; }
	String getClerkSubject() { return clerkSubject; }
	String getStripeCustomerId() { return stripeCustomerId; }
	Instant getCreatedAt() { return createdAt; }
	Instant getLastCheckoutAt() { return lastCheckoutAt; }
	void setLastCheckoutAt(Instant lastCheckoutAt) { this.lastCheckoutAt = lastCheckoutAt; }
}
