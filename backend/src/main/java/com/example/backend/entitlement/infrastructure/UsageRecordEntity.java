package com.example.backend.entitlement.infrastructure;

import com.example.backend.entitlement.application.UsageOperation;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usage_records")
class UsageRecordEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, updatable = false)
	private UsageOperation operation;

	@Column(name = "operation_id", nullable = false, updatable = false)
	private UUID operationId;

	@Column(name = "recorded_at", nullable = false, updatable = false)
	private Instant recordedAt;

	protected UsageRecordEntity() {
	}

	UsageRecordEntity(UUID userId, UsageOperation operation, UUID operationId, Instant recordedAt) {
		this.userId = userId;
		this.operation = operation;
		this.operationId = operationId;
		this.recordedAt = recordedAt;
	}

}
