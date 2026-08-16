package com.example.backend.identity.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_deletion_requests")
class AccountDeletionRequestEntity {
	@Id @Column(name = "user_id") private UUID userId;
	@Column(name = "cancellation_token_hash", nullable = false, length = 32) private byte[] cancellationTokenHash;
	@Column(name = "requested_at", nullable = false) private Instant requestedAt;
	@Column(name = "recovery_ends_at", nullable = false) private Instant recoveryEndsAt;
	protected AccountDeletionRequestEntity() { }
	AccountDeletionRequestEntity(UUID userId, byte[] cancellationTokenHash, Instant requestedAt, Instant recoveryEndsAt) {
		this.userId = userId; this.cancellationTokenHash = cancellationTokenHash; this.requestedAt = requestedAt; this.recoveryEndsAt = recoveryEndsAt;
	}
	UUID getUserId() { return userId; }
	byte[] getCancellationTokenHash() { return cancellationTokenHash; }
	Instant getRequestedAt() { return requestedAt; }
	Instant getRecoveryEndsAt() { return recoveryEndsAt; }
}
