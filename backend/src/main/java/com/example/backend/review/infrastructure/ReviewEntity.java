package com.example.backend.review.infrastructure;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="reviews")
public class ReviewEntity {
	@Id private UUID id; @Column(name="review_request_id",nullable=false,updatable=false) private UUID reviewRequestId; @Column(name="revision_id",nullable=false,updatable=false) private UUID revisionId; @JdbcTypeCode(SqlTypes.JSON) @Column(nullable=false,updatable=false,columnDefinition="jsonb") private String output; @Column(nullable=false,updatable=false) private String model; @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
	protected ReviewEntity() { } public ReviewEntity(UUID reviewRequestId,UUID revisionId,String output,String model,Instant now){this.id=UUID.randomUUID();this.reviewRequestId=reviewRequestId;this.revisionId=revisionId;this.output=output;this.model=model;this.createdAt=now;}
	public UUID getId(){return id;} public UUID getReviewRequestId(){return reviewRequestId;} public String getOutput(){return output;} public String getModel(){return model;} public Instant getCreatedAt(){return createdAt;}
}
