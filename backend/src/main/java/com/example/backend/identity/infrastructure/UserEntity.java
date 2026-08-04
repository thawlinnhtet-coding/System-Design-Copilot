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

	protected UserEntity() {
	}

	UserEntity(String clerkSubject) {
		this.clerkSubject = clerkSubject;
		this.createdAt = Instant.now();
	}

	UUID getId() {
		return id;
	}

	String getClerkSubject() {
		return clerkSubject;
	}

}
