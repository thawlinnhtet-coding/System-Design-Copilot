package com.example.backend.identity.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** An opaque deletion marker; it deliberately has no Clerk subject, email, or product content. */
@Entity
@Table(name = "account_deletion_tombstones")
class AccountDeletionTombstoneEntity {
	@Id private UUID id;
	@Column(name = "deleted_at", nullable = false) private Instant deletedAt;
	protected AccountDeletionTombstoneEntity() { }
	AccountDeletionTombstoneEntity(Instant deletedAt) { this.id = UUID.randomUUID(); this.deletedAt = deletedAt; }
}
