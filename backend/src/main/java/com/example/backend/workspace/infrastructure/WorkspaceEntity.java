package com.example.backend.workspace.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspaces")
public class WorkspaceEntity {

	@Id
	private UUID id;

	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 2000)
	private String description;

	@Column(nullable = false, length = 32, updatable = false)
	private String source;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private WorkspaceStatus status;

	@Column(name = "progress_percent", nullable = false)
	private int progressPercent;

	@Column(name = "save_state", nullable = false, length = 32)
	private String saveState;

	@Column(name = "latest_review_state", nullable = false, length = 32)
	private String latestReviewState;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected WorkspaceEntity() {
	}

	public WorkspaceEntity(UUID userId, String name, String description, Instant now) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.name = name;
		this.description = description;
		this.source = "CUSTOM";
		this.status = WorkspaceStatus.ACTIVE;
		this.progressPercent = 0;
		this.saveState = "NOT_STARTED";
		this.latestReviewState = "NOT_REQUESTED";
		this.createdAt = now;
		this.updatedAt = now;
	}

	public UUID getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getName() {
		return name;
	}

	public String getDescription() {
		return description;
	}

	public String getSource() {
		return source;
	}

	public WorkspaceStatus getStatus() {
		return status;
	}

	public int getProgressPercent() {
		return progressPercent;
	}

	public String getSaveState() {
		return saveState;
	}

	public String getLatestReviewState() {
		return latestReviewState;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void rename(String name, Instant now) {
		this.name = name;
		this.updatedAt = now;
	}

	public void archive(Instant now) {
		this.status = WorkspaceStatus.ARCHIVED;
		this.updatedAt = now;
	}

	public void restore(Instant now) {
		this.status = WorkspaceStatus.ACTIVE;
		this.updatedAt = now;
	}
}
