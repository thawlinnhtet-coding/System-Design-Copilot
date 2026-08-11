package com.example.backend.reasoning.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace_decisions")
public class DecisionEntity {

	@Id
	private UUID id;
	@Column(name = "workspace_id", nullable = false, updatable = false)
	private UUID workspaceId;
	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;
	@Column(nullable = false, length = 500)
	private String title;
	@Column(name = "chosen_option", nullable = false, length = 1000)
	private String chosenOption;
	@Column(nullable = false, length = 2000)
	private String rationale;
	@Column(length = 2000)
	private String alternatives;
	@Column(name = "positive_consequences", length = 2000)
	private String positiveConsequences;
	@Column(length = 2000)
	private String risks;
	@Column(nullable = false, length = 32)
	private String status;
	@Column(name = "evidence_refs", nullable = false, columnDefinition = "TEXT")
	private String evidenceRefs;
	@Column(name = "sort_order", nullable = false)
	private int orderIndex;
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected DecisionEntity() {
	}

	public DecisionEntity(UUID userId, UUID workspaceId, String title, String chosenOption, String rationale,
			String alternatives, String positiveConsequences, String risks, String status, String evidenceRefs,
			int orderIndex, Instant now) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.workspaceId = workspaceId;
		this.title = title;
		this.chosenOption = chosenOption;
		this.rationale = rationale;
		this.alternatives = alternatives;
		this.positiveConsequences = positiveConsequences;
		this.risks = risks;
		this.status = status;
		this.evidenceRefs = evidenceRefs;
		this.orderIndex = orderIndex;
		this.createdAt = now;
		this.updatedAt = now;
	}

	public void update(String title, String chosenOption, String rationale, String alternatives,
			String positiveConsequences, String risks, String status, String evidenceRefs, Integer orderIndex, Instant now) {
		this.title = title;
		this.chosenOption = chosenOption;
		this.rationale = rationale;
		this.alternatives = alternatives;
		this.positiveConsequences = positiveConsequences;
		this.risks = risks;
		this.status = status;
		this.evidenceRefs = evidenceRefs;
		if (orderIndex != null) {
			this.orderIndex = orderIndex;
		}
		this.updatedAt = now;
	}

	public UUID getId() { return id; }
	public UUID getWorkspaceId() { return workspaceId; }
	public UUID getUserId() { return userId; }
	public String getTitle() { return title; }
	public String getChosenOption() { return chosenOption; }
	public String getRationale() { return rationale; }
	public String getAlternatives() { return alternatives; }
	public String getPositiveConsequences() { return positiveConsequences; }
	public String getRisks() { return risks; }
	public String getStatus() { return status; }
	public String getEvidenceRefs() { return evidenceRefs; }
	public int getOrderIndex() { return orderIndex; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
