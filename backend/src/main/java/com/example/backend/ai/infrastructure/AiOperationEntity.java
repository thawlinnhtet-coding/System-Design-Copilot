package com.example.backend.ai.infrastructure;

import com.example.backend.ai.application.AiOperation;
import com.example.backend.ai.application.AiOperationStatus;
import com.example.backend.ai.application.AiProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_operation_records")
class AiOperationEntity {

	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;

	@Column(name = "workspace_id", nullable = false, updatable = false)
	private UUID workspaceId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, updatable = false, length = 16)
	private AiProfile profile;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, updatable = false, length = 32)
	private AiOperationStatus status;

	@Column(length = 255, updatable = false)
	private String model;

	@Column(name = "provider_request_id", length = 255, updatable = false)
	private String providerRequestId;

	@Column(name = "prompt_version", nullable = false, length = 64, updatable = false)
	private String promptVersion;

	@Column(name = "input_tokens", updatable = false)
	private Integer inputTokens;

	@Column(name = "output_tokens", updatable = false)
	private Integer outputTokens;

	@Column(name = "total_tokens", updatable = false)
	private Integer totalTokens;

	@Column(name = "estimated_cost_usd", nullable = false, precision = 12, scale = 6, updatable = false)
	private BigDecimal estimatedCostUsd;

	@Column(name = "charged_cost_usd", nullable = false, precision = 12, scale = 6, updatable = false)
	private BigDecimal chargedCostUsd;

	@Column(name = "latency_ms", updatable = false)
	private Long latencyMs;

	@Column(name = "outcome_code", length = 64, updatable = false)
	private String outcomeCode;

	@Column(name = "accepted_output", columnDefinition = "TEXT", updatable = false)
	private String acceptedOutput;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@Column(updatable = false)
	private Instant completedAt;

	protected AiOperationEntity() {
	}

	AiOperationEntity(AiOperation operation) {
		this.id = operation.id();
		this.userId = operation.userId();
		this.workspaceId = operation.workspaceId();
		this.profile = operation.profile();
		this.status = operation.status();
		this.model = operation.model();
		this.providerRequestId = operation.providerRequestId();
		this.promptVersion = operation.promptVersion();
		this.inputTokens = operation.inputTokens();
		this.outputTokens = operation.outputTokens();
		this.totalTokens = operation.totalTokens();
		this.estimatedCostUsd = operation.estimatedCostUsd();
		this.chargedCostUsd = operation.chargedCostUsd();
		this.latencyMs = operation.latencyMs();
		this.outcomeCode = operation.outcomeCode();
		this.acceptedOutput = operation.acceptedOutput();
		this.createdAt = operation.createdAt();
		this.completedAt = operation.completedAt();
	}

	AiOperation toOperation() {
		return new AiOperation(id, userId, workspaceId, profile, status, model, providerRequestId, promptVersion,
				inputTokens, outputTokens, totalTokens, estimatedCostUsd, chargedCostUsd, latencyMs, outcomeCode,
				acceptedOutput, createdAt, completedAt);
	}
}
