package com.example.backend.billing.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "stripe_webhook_receipts")
class StripeWebhookReceiptEntity {

	@Id
	@Column(name = "stripe_event_id")
	private String stripeEventId;

	@Column(name = "event_type", nullable = false)
	private String eventType;

	@Column(name = "event_created_at", nullable = false)
	private Instant eventCreatedAt;

	@Column(name = "received_at", nullable = false)
	private Instant receivedAt;

	protected StripeWebhookReceiptEntity() {
	}

	StripeWebhookReceiptEntity(String stripeEventId, String eventType, Instant eventCreatedAt, Instant receivedAt) {
		this.stripeEventId = stripeEventId;
		this.eventType = eventType;
		this.eventCreatedAt = eventCreatedAt;
		this.receivedAt = receivedAt;
	}
}
