package com.example.backend.reasoning.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace_questions")
public class QuestionEntity {

	@Id
	private UUID id;
	@Column(name = "workspace_id", nullable = false, updatable = false)
	private UUID workspaceId;
	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;
	@Column(nullable = false, length = 2000)
	private String question;
	@Column(name = "why_it_matters", nullable = false, length = 2000)
	private String whyItMatters;
	@Column(nullable = false, length = 32)
	private String status;
	@Column(name = "resolution_notes", length = 2000)
	private String resolutionNotes;
	@Column(name = "related_requirement_ids", nullable = false, columnDefinition = "TEXT")
	private String relatedRequirementIds;
	@Column(name = "related_assumption_ids", nullable = false, columnDefinition = "TEXT")
	private String relatedAssumptionIds;
	@Column(name = "resulting_decision_id")
	private UUID resultingDecisionId;
	@Column(name = "sort_order", nullable = false)
	private int orderIndex;
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected QuestionEntity() {
	}

	public QuestionEntity(UUID userId, UUID workspaceId, String question, String whyItMatters, String status,
			String resolutionNotes, String relatedRequirementIds, String relatedAssumptionIds, UUID resultingDecisionId,
			int orderIndex, Instant now) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.workspaceId = workspaceId;
		this.question = question;
		this.whyItMatters = whyItMatters;
		this.status = status;
		this.resolutionNotes = resolutionNotes;
		this.relatedRequirementIds = relatedRequirementIds;
		this.relatedAssumptionIds = relatedAssumptionIds;
		this.resultingDecisionId = resultingDecisionId;
		this.orderIndex = orderIndex;
		this.createdAt = now;
		this.updatedAt = now;
	}

	public void update(String question, String whyItMatters, String status, String resolutionNotes,
			String relatedRequirementIds, String relatedAssumptionIds, UUID resultingDecisionId, Integer orderIndex, Instant now) {
		this.question = question;
		this.whyItMatters = whyItMatters;
		this.status = status;
		this.resolutionNotes = resolutionNotes;
		this.relatedRequirementIds = relatedRequirementIds;
		this.relatedAssumptionIds = relatedAssumptionIds;
		this.resultingDecisionId = resultingDecisionId;
		if (orderIndex != null) {
			this.orderIndex = orderIndex;
		}
		this.updatedAt = now;
	}

	public UUID getId() { return id; }
	public UUID getWorkspaceId() { return workspaceId; }
	public UUID getUserId() { return userId; }
	public String getQuestion() { return question; }
	public String getWhyItMatters() { return whyItMatters; }
	public String getStatus() { return status; }
	public String getResolutionNotes() { return resolutionNotes; }
	public String getRelatedRequirementIds() { return relatedRequirementIds; }
	public String getRelatedAssumptionIds() { return relatedAssumptionIds; }
	public UUID getResultingDecisionId() { return resultingDecisionId; }
	public int getOrderIndex() { return orderIndex; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
