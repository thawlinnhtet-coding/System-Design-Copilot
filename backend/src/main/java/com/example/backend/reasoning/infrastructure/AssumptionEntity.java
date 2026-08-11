package com.example.backend.reasoning.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace_assumptions")
public class AssumptionEntity {

	@Id
	private UUID id;
	@Column(name = "workspace_id", nullable = false, updatable = false)
	private UUID workspaceId;
	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;
	@Column(nullable = false, length = 64)
	private String category;
	@Column(name = "quantitative_value", length = 500)
	private String quantitativeValue;
	@Column(length = 64)
	private String unit;
	@Column(length = 2000)
	private String rationale;
	@Column(nullable = false, length = 32)
	private String confidence;
	@Column(nullable = false, length = 32)
	private String status;
	@Column(length = 500)
	private String source;
	@Column(name = "related_requirement_ids", nullable = false, columnDefinition = "TEXT")
	private String relatedRequirementIds;
	@Column(name = "sort_order", nullable = false)
	private int orderIndex;
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected AssumptionEntity() {
	}

	public AssumptionEntity(UUID userId, UUID workspaceId, String category, String quantitativeValue, String unit,
			String rationale, String confidence, String status, String source, String relatedRequirementIds, int orderIndex, Instant now) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.workspaceId = workspaceId;
		this.category = category;
		this.quantitativeValue = quantitativeValue;
		this.unit = unit;
		this.rationale = rationale;
		this.confidence = confidence;
		this.status = status;
		this.source = source;
		this.relatedRequirementIds = relatedRequirementIds;
		this.orderIndex = orderIndex;
		this.createdAt = now;
		this.updatedAt = now;
	}

	public void update(String category, String quantitativeValue, String unit, String rationale, String confidence,
			String status, String source, String relatedRequirementIds, Integer orderIndex, Instant now) {
		this.category = category;
		this.quantitativeValue = quantitativeValue;
		this.unit = unit;
		this.rationale = rationale;
		this.confidence = confidence;
		this.status = status;
		this.source = source;
		this.relatedRequirementIds = relatedRequirementIds;
		if (orderIndex != null) {
			this.orderIndex = orderIndex;
		}
		this.updatedAt = now;
	}

	public UUID getId() { return id; }
	public UUID getWorkspaceId() { return workspaceId; }
	public UUID getUserId() { return userId; }
	public String getCategory() { return category; }
	public String getQuantitativeValue() { return quantitativeValue; }
	public String getUnit() { return unit; }
	public String getRationale() { return rationale; }
	public String getConfidence() { return confidence; }
	public String getStatus() { return status; }
	public String getSource() { return source; }
	public String getRelatedRequirementIds() { return relatedRequirementIds; }
	public int getOrderIndex() { return orderIndex; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
