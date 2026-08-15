package com.example.backend.scenario.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace_scenarios")
public class ScenarioEntity {
	@Id private UUID id;
	@Column(name = "workspace_id", nullable = false, updatable = false) private UUID workspaceId;
	@Column(name = "user_id", nullable = false, updatable = false) private UUID userId;
	@Enumerated(EnumType.STRING) @Column(nullable = false, updatable = false, length = 32) private ScenarioSource source;
	@Column(nullable = false, updatable = false) private int orderIndex;
	@Column(nullable = false, length = 160) private String title;
	@Column(name = "changed_condition", nullable = false, length = 1000) private String changedCondition;
	@Column(nullable = false, length = 4000) private String details;
	@Column(nullable = false, length = 32) private String category;
	@Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private ScenarioStatus status;
	@Column(length = 8000) private String response;
	@Column(name = "architecture_changes", length = 4000) private String architectureChanges;
	@Column(name = "decision_changes", length = 4000) private String decisionChanges;
	@Column(name = "started_at") private Instant startedAt;
	@Column(name = "completed_at") private Instant completedAt;
	@Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
	@Column(name = "updated_at", nullable = false) private Instant updatedAt;

	protected ScenarioEntity() { }

	public ScenarioEntity(UUID workspaceId, UUID userId, ScenarioSource source, int orderIndex, String title, String changedCondition, String details, String category, Instant now) {
		this.id = UUID.randomUUID(); this.workspaceId = workspaceId; this.userId = userId; this.source = source; this.orderIndex = orderIndex;
		this.title = title; this.changedCondition = changedCondition; this.details = details; this.category = category;
		this.status = ScenarioStatus.AVAILABLE; this.createdAt = now; this.updatedAt = now;
	}

	public UUID getId() { return id; } public UUID getWorkspaceId() { return workspaceId; } public UUID getUserId() { return userId; }
	public ScenarioSource getSource() { return source; } public int getOrderIndex() { return orderIndex; } public String getTitle() { return title; }
	public String getChangedCondition() { return changedCondition; } public String getDetails() { return details; } public String getCategory() { return category; }
	public ScenarioStatus getStatus() { return status; } public String getResponse() { return response; } public String getArchitectureChanges() { return architectureChanges; }
	public String getDecisionChanges() { return decisionChanges; } public Instant getStartedAt() { return startedAt; } public Instant getCompletedAt() { return completedAt; }
	public Instant getCreatedAt() { return createdAt; } public Instant getUpdatedAt() { return updatedAt; }

	public void start(Instant now) { status = ScenarioStatus.REVEALED; startedAt = now; updatedAt = now; }
	public void saveDraft(String response, String architectureChanges, String decisionChanges, Instant now) { this.response = response; this.architectureChanges = architectureChanges; this.decisionChanges = decisionChanges; status = ScenarioStatus.DRAFT; updatedAt = now; }
	public void complete(String response, String architectureChanges, String decisionChanges, Instant now) { this.response = response; this.architectureChanges = architectureChanges; this.decisionChanges = decisionChanges; status = ScenarioStatus.COMPLETED; completedAt = now; updatedAt = now; }
}
