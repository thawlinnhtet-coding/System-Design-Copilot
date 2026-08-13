package com.example.backend.architecture.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "architecture_revisions")
public class ArchitectureRevisionEntity {
	@Id private UUID id;
	@Column(nullable = false, updatable = false) private UUID workspaceId;
	@Column(nullable = false, updatable = false) private UUID userId;
	@Column(nullable = false, updatable = false) private long documentVersion;
	@JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, updatable = false, columnDefinition = "jsonb") private String document;
	@JdbcTypeCode(SqlTypes.JSON) @Column(name = "reasoning_context", nullable = false, updatable = false, columnDefinition = "jsonb") private String reasoningContext;
	@Column(nullable = false, updatable = false) private Instant createdAt;
	protected ArchitectureRevisionEntity() { }
	public ArchitectureRevisionEntity(UUID workspaceId, UUID userId, long documentVersion, String document, String reasoningContext, Instant createdAt) {
		this.id = UUID.randomUUID(); this.workspaceId = workspaceId; this.userId = userId; this.documentVersion = documentVersion; this.document = document; this.reasoningContext = reasoningContext; this.createdAt = createdAt;
	}
	public UUID getId() { return id; } public UUID getWorkspaceId() { return workspaceId; } public long getDocumentVersion() { return documentVersion; } public String getDocument() { return document; } public String getReasoningContext() { return reasoningContext; } public Instant getCreatedAt() { return createdAt; }
}
