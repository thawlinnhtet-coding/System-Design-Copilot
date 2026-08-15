package com.example.backend.review.infrastructure;

import com.example.backend.review.application.ReviewJobStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="review_jobs")
public class ReviewJobEntity {
	@Id private UUID id;
	@Column(name="review_request_id",nullable=false,updatable=false) private UUID reviewRequestId;
	@Enumerated(EnumType.STRING) @Column(nullable=false) private ReviewJobStatus status;
	@Column(nullable=false) private int attempts;
	@Column(name="max_attempts",nullable=false,updatable=false) private int maxAttempts;
	@Column(name="lease_owner") private String leaseOwner;
	@Column(name="lease_expires_at") private Instant leaseExpiresAt;
	@Column(name="last_failure_code") private String lastFailureCode;
	@Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
	@Column(name="updated_at",nullable=false) private Instant updatedAt;
	protected ReviewJobEntity() { }
	public ReviewJobEntity(UUID reviewRequestId,int maxAttempts,Instant now){this.id=UUID.randomUUID();this.reviewRequestId=reviewRequestId;this.status=ReviewJobStatus.QUEUED;this.maxAttempts=maxAttempts;this.createdAt=now;this.updatedAt=now;}
	public UUID getId(){return id;} public UUID getReviewRequestId(){return reviewRequestId;} public ReviewJobStatus getStatus(){return status;} public int getAttempts(){return attempts;} public int getMaxAttempts(){return maxAttempts;} public String getLastFailureCode(){return lastFailureCode;}
	public boolean claim(String worker,Instant now){if(status==ReviewJobStatus.COMPLETED||status==ReviewJobStatus.DEAD_LETTERED||(status==ReviewJobStatus.PROCESSING&&leaseExpiresAt!=null&&leaseExpiresAt.isAfter(now)))return false;status=ReviewJobStatus.PROCESSING;attempts++;leaseOwner=worker;leaseExpiresAt=now.plusSeconds(60);updatedAt=now;return true;}
	public boolean exhausted(){return attempts>=maxAttempts;} public void retry(String code,Instant now){status=ReviewJobStatus.RETRYING;lastFailureCode=code;leaseOwner=null;leaseExpiresAt=null;updatedAt=now;} public void deadLetter(String code,Instant now){status=ReviewJobStatus.DEAD_LETTERED;lastFailureCode=code;leaseOwner=null;leaseExpiresAt=null;updatedAt=now;} public void complete(Instant now){status=ReviewJobStatus.COMPLETED;leaseOwner=null;leaseExpiresAt=null;updatedAt=now;}
}
