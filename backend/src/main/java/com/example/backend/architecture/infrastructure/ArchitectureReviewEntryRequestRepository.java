package com.example.backend.architecture.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ArchitectureReviewEntryRequestRepository extends JpaRepository<ArchitectureReviewEntryRequestEntity, UUID> {

	Optional<ArchitectureReviewEntryRequestEntity> findByUserIdAndIdempotencyKey(UUID userId, String idempotencyKey);
}
