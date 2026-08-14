package com.example.backend.workspace.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

	@Enumerated(EnumType.STRING)
	@Column(name = "workspace_type", nullable = false, length = 32, updatable = false)
	private WorkspaceType type;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32, updatable = false)
	private WorkspaceSource source;

	@Column(name = "challenge_version_id", updatable = false)
	private UUID challengeVersionId;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "challenge_snapshot", columnDefinition = "jsonb", updatable = false)
	private String challengeSnapshot;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private WorkspaceStatus status;

	@Column(name = "progress_percent", nullable = false)
	private int progressPercent;

	@Column(name = "save_state", nullable = false, length = 32)
	private String saveState;

	@Column(name = "latest_review_state", nullable = false, length = 32)
	private String latestReviewState;

	@Column(name = "focus_stage", nullable = false, length = 32)
	private String focusStage;

	@Column(name = "focus_panel", nullable = false, length = 32)
	private String focusPanel;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "canvas_viewport", columnDefinition = "jsonb")
	private String canvasViewport;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected WorkspaceEntity() {
	}

	public WorkspaceEntity(UUID userId, String name, String description, WorkspaceType type, WorkspaceSource source, Instant now) {
		this(userId, name, description, type, source, null, null, now);
	}

	public WorkspaceEntity(UUID userId, String name, String description, WorkspaceType type, WorkspaceSource source, UUID challengeVersionId, Instant now) {
		this(userId, name, description, type, source, challengeVersionId, null, now);
	}

	public WorkspaceEntity(UUID userId, String name, String description, WorkspaceType type, WorkspaceSource source, UUID challengeVersionId, String challengeSnapshot, Instant now) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.name = name;
		this.description = description;
		this.type = type;
		this.source = source;
		this.challengeVersionId = challengeVersionId;
		this.challengeSnapshot = challengeSnapshot;
		this.status = WorkspaceStatus.ACTIVE;
		this.progressPercent = 0;
		this.saveState = "NOT_STARTED";
		this.latestReviewState = "NOT_REQUESTED";
		this.focusStage = "CLARIFY";
		this.focusPanel = "REASONING";
		this.canvasViewport = "{\"x\":0,\"y\":0,\"zoom\":1}";
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

	public WorkspaceType getType() {
		return type;
	}

	public WorkspaceSource getSource() {
		return source;
	}

	public UUID getChallengeVersionId() {
		return challengeVersionId;
	}

	public String getChallengeSnapshot() {
		return challengeSnapshot;
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

	public String getFocusStage() {
		return focusStage;
	}

	public String getFocusPanel() {
		return focusPanel;
	}

	public String getCanvasViewport() {
		return canvasViewport;
	}

	public void updateFocus(String focusStage, String focusPanel, String canvasViewport, Instant now) {
		this.focusStage = focusStage;
		this.focusPanel = focusPanel;
		this.canvasViewport = canvasViewport;
		this.updatedAt = now;
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
