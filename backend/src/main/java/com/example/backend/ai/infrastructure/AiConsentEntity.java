package com.example.backend.ai.infrastructure;

import com.example.backend.ai.application.AiConsent;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_processing_consents")
class AiConsentEntity {

	@Id
	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;

	@Column(name = "granted", nullable = false)
	private boolean granted;

	@Column(name = "policy_version", nullable = false, length = 64)
	private String policyVersion;

	@Column(name = "changed_at", nullable = false)
	private Instant changedAt;

	protected AiConsentEntity() {
	}

	AiConsentEntity(AiConsent consent) {
		this.userId = consent.userId();
		this.granted = consent.granted();
		this.policyVersion = consent.policyVersion();
		this.changedAt = consent.changedAt();
	}

	AiConsent toConsent() {
		return new AiConsent(userId, granted, policyVersion, changedAt);
	}
}
