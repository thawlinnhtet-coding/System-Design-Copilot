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
@Table(name = "workspace_architecture_documents")
public class ArchitectureDocumentEntity {
	@Id private UUID workspaceId;
	@Column(nullable = false, updatable = false) private UUID userId;
	@Column(nullable = false) private long version;
	@JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb") private String document;
	@Column(nullable = false) private Instant updatedAt;

	protected ArchitectureDocumentEntity() { }
	public ArchitectureDocumentEntity(UUID workspaceId, UUID userId, long version, String document, Instant updatedAt) {
		this.workspaceId = workspaceId; this.userId = userId; this.version = version; this.document = document; this.updatedAt = updatedAt;
	}
	public UUID getWorkspaceId() { return workspaceId; }
	public long getVersion() { return version; }
	public String getDocument() { return document; }
	public Instant getUpdatedAt() { return updatedAt; }
	public void replace(long version, String document, Instant updatedAt) { this.version = version; this.document = document; this.updatedAt = updatedAt; }
}
