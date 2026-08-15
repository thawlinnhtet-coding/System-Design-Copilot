package com.example.backend.architecture.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "architecture_review_entry_requests")
public class ArchitectureReviewEntryRequestEntity {

	@Id
	private UUID id;

	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;

	@Column(name = "idempotency_key", nullable = false, length = 255, updatable = false)
	private String idempotencyKey;

	@Column(name = "request_fingerprint", nullable = false, length = 64, updatable = false)
	private String requestFingerprint;

	@Column(name = "workspace_id")
	private UUID workspaceId;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected ArchitectureReviewEntryRequestEntity() {
	}

	public ArchitectureReviewEntryRequestEntity(UUID userId, String idempotencyKey, String requestFingerprint, Instant createdAt) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.idempotencyKey = idempotencyKey;
		this.requestFingerprint = requestFingerprint;
		this.createdAt = createdAt;
	}

	public String getRequestFingerprint() {
		return requestFingerprint;
	}

	public UUID getWorkspaceId() {
		return workspaceId;
	}

	public void complete(UUID workspaceId) {
		this.workspaceId = workspaceId;
	}
}
