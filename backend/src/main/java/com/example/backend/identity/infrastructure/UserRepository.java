package com.example.backend.identity.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

interface UserRepository extends JpaRepository<UserEntity, UUID> {

	Optional<UserEntity> findByClerkSubject(String clerkSubject);

}
