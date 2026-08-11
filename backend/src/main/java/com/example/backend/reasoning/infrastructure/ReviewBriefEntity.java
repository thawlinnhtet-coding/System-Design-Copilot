package com.example.backend.reasoning.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace_review_briefs")
public class ReviewBriefEntity {

	@Id
	@Column(name = "workspace_id")
	private UUID workspaceId;
	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;
	@Column(name = "system_description", nullable = false, length = 4000)
	private String systemDescription;
	@Column(name = "review_goal", nullable = false, length = 2000)
	private String reviewGoal;
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected ReviewBriefEntity() {
	}

	public ReviewBriefEntity(UUID userId, UUID workspaceId, String systemDescription, String reviewGoal, Instant now) {
		this.userId = userId;
		this.workspaceId = workspaceId;
		this.systemDescription = systemDescription;
		this.reviewGoal = reviewGoal;
		this.createdAt = now;
		this.updatedAt = now;
	}

	public void update(String systemDescription, String reviewGoal, Instant now) {
		this.systemDescription = systemDescription;
		this.reviewGoal = reviewGoal;
		this.updatedAt = now;
	}

	public UUID getWorkspaceId() { return workspaceId; }
	public UUID getUserId() { return userId; }
	public String getSystemDescription() { return systemDescription; }
	public String getReviewGoal() { return reviewGoal; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
