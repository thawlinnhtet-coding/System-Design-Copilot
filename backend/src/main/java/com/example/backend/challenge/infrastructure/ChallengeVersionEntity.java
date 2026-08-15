package com.example.backend.challenge.infrastructure;

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
@Table(name = "challenge_versions")
public class ChallengeVersionEntity {
	@Id
	private UUID id;
	@Column(nullable = false, updatable = false)
	private UUID challengeId;
	@Column(nullable = false, updatable = false)
	private int version;
	@Column(nullable = false, length = 160, updatable = false)
	private String title;
	@Column(nullable = false, length = 2000, updatable = false)
	private String description;
	@Column(name = "problem_statement", nullable = false, length = 8000, updatable = false)
	private String problemStatement;
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16, updatable = false)
	private ChallengeDifficulty difficulty;
	@Column(name = "estimated_minutes", nullable = false, updatable = false)
	private int estimatedMinutes;
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "topic_packs", nullable = false, columnDefinition = "jsonb", updatable = false)
	private String topicPacks;
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "initial_constraints", nullable = false, columnDefinition = "jsonb", updatable = false)
	private String initialConstraints;
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "skill_coverage", nullable = false, columnDefinition = "jsonb", updatable = false)
	private String skillCoverage;
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "scenario_preview", nullable = false, columnDefinition = "jsonb", updatable = false)
	private String scenarioPreview;
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "quality_scores", nullable = false, columnDefinition = "jsonb", updatable = false)
	private String qualityScores;
	@Column(name = "independent_reviewer", nullable = false, length = 120, updatable = false)
	private String independentReviewer;
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private ChallengeStatus status;
	@Column(name = "published_at")
	private Instant publishedAt;
	protected ChallengeVersionEntity() { }
	public UUID getId() { return id; }
	public UUID getChallengeId() { return challengeId; }
	public int getVersion() { return version; }
	public String getTitle() { return title; }
	public String getDescription() { return description; }
	public String getProblemStatement() { return problemStatement; }
	public ChallengeDifficulty getDifficulty() { return difficulty; }
	public int getEstimatedMinutes() { return estimatedMinutes; }
	public String getTopicPacks() { return topicPacks; }
	public String getInitialConstraints() { return initialConstraints; }
	public String getSkillCoverage() { return skillCoverage; }
	public String getScenarioPreview() { return scenarioPreview; }
	public String getQualityScores() { return qualityScores; }
	public String getIndependentReviewer() { return independentReviewer; }
	public ChallengeStatus getStatus() { return status; }
	public void setStatus(ChallengeStatus status) { this.status = status; }
	public void publishAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}
