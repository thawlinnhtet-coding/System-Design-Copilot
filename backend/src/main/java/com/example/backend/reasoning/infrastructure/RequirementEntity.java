package com.example.backend.reasoning.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace_requirements")
public class RequirementEntity {

	@Id
	private UUID id;
	@Column(name = "workspace_id", nullable = false, updatable = false)
	private UUID workspaceId;
	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;
	@Column(nullable = false, length = 32)
	private String kind;
	@Column(nullable = false, length = 2000)
	private String statement;
	@Column(nullable = false, length = 32)
	private String priority;
	@Column(nullable = false, length = 32)
	private String status;
	@Column(name = "measurable_target", length = 500)
	private String measurableTarget;
	@Column(length = 2000)
	private String rationale;
	@Column(length = 500)
	private String source;
	@Column(name = "sort_order", nullable = false)
	private int orderIndex;
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected RequirementEntity() {
	}

	public RequirementEntity(UUID userId, UUID workspaceId, String kind, String statement, String priority, String status,
			String measurableTarget, String rationale, String source, int orderIndex, Instant now) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.workspaceId = workspaceId;
		this.kind = kind;
		this.statement = statement;
		this.priority = priority;
		this.status = status;
		this.measurableTarget = measurableTarget;
		this.rationale = rationale;
		this.source = source;
		this.orderIndex = orderIndex;
		this.createdAt = now;
		this.updatedAt = now;
	}

	public void update(String kind, String statement, String priority, String status, String measurableTarget,
			String rationale, String source, Integer orderIndex, Instant now) {
		this.kind = kind;
		this.statement = statement;
		this.priority = priority;
		this.status = status;
		this.measurableTarget = measurableTarget;
		this.rationale = rationale;
		this.source = source;
		if (orderIndex != null) {
			this.orderIndex = orderIndex;
		}
		this.updatedAt = now;
	}

	public UUID getId() { return id; }
	public UUID getWorkspaceId() { return workspaceId; }
	public UUID getUserId() { return userId; }
	public String getKind() { return kind; }
	public String getStatement() { return statement; }
	public String getPriority() { return priority; }
	public String getStatus() { return status; }
	public String getMeasurableTarget() { return measurableTarget; }
	public String getRationale() { return rationale; }
	public String getSource() { return source; }
	public int getOrderIndex() { return orderIndex; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
