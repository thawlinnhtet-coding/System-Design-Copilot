package com.example.backend.review.infrastructure;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="review_outbox_events")
public class ReviewOutboxEventEntity {
	@Id private UUID id; @Column(name="review_job_id",nullable=false,updatable=false) private UUID reviewJobId; @Column(name="event_type",nullable=false,updatable=false) private String eventType; @Column(nullable=false) private String status; @Column(name="published_at") private Instant publishedAt; @Column(name="lease_owner") private String leaseOwner; @Column(name="lease_expires_at") private Instant leaseExpiresAt; @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
	protected ReviewOutboxEventEntity() { } public ReviewOutboxEventEntity(UUID reviewJobId,Instant now){this.id=UUID.randomUUID();this.reviewJobId=reviewJobId;this.eventType="review.requested.v1";this.status="PENDING";this.createdAt=now;}
	public UUID getId(){return id;} public UUID getReviewJobId(){return reviewJobId;} public boolean pending(){return "PENDING".equals(status);} public void published(Instant now){status="PUBLISHED";publishedAt=now;leaseOwner=null;leaseExpiresAt=null;} public void requeue(){status="PENDING";publishedAt=null;leaseOwner=null;leaseExpiresAt=null;}
}
