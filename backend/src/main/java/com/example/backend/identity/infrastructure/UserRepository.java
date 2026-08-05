package com.example.backend.identity.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

interface UserRepository extends JpaRepository<UserEntity, UUID> {

	Optional<UserEntity> findByClerkSubject(String clerkSubject);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select user from UserEntity user where user.id = :userId")
	Optional<UserEntity> findByIdForUpdate(UUID userId);

}
