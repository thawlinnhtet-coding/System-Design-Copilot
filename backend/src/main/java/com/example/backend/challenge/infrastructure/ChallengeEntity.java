package com.example.backend.challenge.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "challenges")
public class ChallengeEntity {
	@Id
	private UUID id;
	@Column(nullable = false, unique = true, length = 80, updatable = false)
	private String slug;
	@Column(nullable = false, length = 120, updatable = false)
	private String topic;
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private ChallengeStatus status;
	@Column(nullable = false, updatable = false)
	private Instant createdAt;
	protected ChallengeEntity() { }
	public UUID getId() { return id; }
	public String getSlug() { return slug; }
	public String getTopic() { return topic; }
	public ChallengeStatus getStatus() { return status; }
}
