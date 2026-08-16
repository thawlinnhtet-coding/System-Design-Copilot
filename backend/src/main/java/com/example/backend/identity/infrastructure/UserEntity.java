package com.example.backend.identity.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
class UserEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "clerk_subject", nullable = false, unique = true, updatable = false)
	private String clerkSubject;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "active_workspace_count", nullable = false)
	private int activeWorkspaceCount;

	@Column(name = "access_status", nullable = false)
	private String accessStatus;

	protected UserEntity() {
	}

	UserEntity(String clerkSubject) {
		this.clerkSubject = clerkSubject;
		this.createdAt = Instant.now();
		this.accessStatus = "ACTIVE";
	}

	UUID getId() {
		return id;
	}

	String getClerkSubject() {
		return clerkSubject;
	}

	int getActiveWorkspaceCount() {
		return activeWorkspaceCount;
	}

	void setActiveWorkspaceCount(int activeWorkspaceCount) {
		this.activeWorkspaceCount = activeWorkspaceCount;
	}

	boolean isSuspended() { return "DELETION_PENDING".equals(accessStatus); }
	void suspend() { this.accessStatus = "DELETION_PENDING"; }
	void restore() { this.accessStatus = "ACTIVE"; }

}
