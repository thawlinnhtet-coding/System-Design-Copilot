package com.example.backend.review.infrastructure;

import com.example.backend.review.application.ReviewStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "review_requests")
public class ReviewRequestEntity {
	@Id private UUID id;
	@Column(name="user_id", nullable=false, updatable=false) private UUID userId;
	@Column(name="workspace_id", nullable=false, updatable=false) private UUID workspaceId;
	@Column(name="revision_id", nullable=false, updatable=false) private UUID revisionId;
	@Column(name="idempotency_key", nullable=false, updatable=false) private String idempotencyKey;
	@Column(name="request_fingerprint", nullable=false, updatable=false) private String requestFingerprint;
	@Enumerated(EnumType.STRING) @Column(nullable=false) private ReviewStatus status;
	@Column(name="error_code") private String errorCode;
	@Column(name="created_at", nullable=false, updatable=false) private Instant createdAt;
	@Column(name="completed_at") private Instant completedAt;
	protected ReviewRequestEntity() { }
	public ReviewRequestEntity(UUID userId, UUID workspaceId, UUID revisionId, String idempotencyKey, String requestFingerprint, Instant now) { this.id=UUID.randomUUID(); this.userId=userId; this.workspaceId=workspaceId; this.revisionId=revisionId; this.idempotencyKey=idempotencyKey; this.requestFingerprint=requestFingerprint; this.status=ReviewStatus.QUEUED; this.createdAt=now; }
	public UUID getId(){return id;} public UUID getUserId(){return userId;} public UUID getWorkspaceId(){return workspaceId;} public UUID getRevisionId(){return revisionId;} public String getRequestFingerprint(){return requestFingerprint;} public ReviewStatus getStatus(){return status;} public String getErrorCode(){return errorCode;} public Instant getCreatedAt(){return createdAt;} public Instant getCompletedAt(){return completedAt;}
	public void processing(){status=ReviewStatus.PROCESSING;errorCode=null;} public void retrying(String code){status=ReviewStatus.RETRYING;errorCode=code;} public void complete(Instant now){status=ReviewStatus.COMPLETED;errorCode=null;completedAt=now;} public void fail(String code){status=ReviewStatus.FAILED;errorCode=code;}
}
