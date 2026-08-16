package com.example.backend.review.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface ReviewRequestRepository extends JpaRepository<ReviewRequestEntity, UUID> {
	Optional<ReviewRequestEntity> findByUserIdAndIdempotencyKey(UUID userId, String idempotencyKey);
	List<ReviewRequestEntity> findByUserIdAndWorkspaceIdOrderByCreatedAtDesc(UUID userId, UUID workspaceId);
	List<ReviewRequestEntity> findByUserIdAndStatusOrderByCompletedAtDesc(UUID userId, com.example.backend.review.application.ReviewStatus status);
}
