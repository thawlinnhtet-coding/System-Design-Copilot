package com.example.backend.review.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<ReviewEntity, UUID> {
	Optional<ReviewEntity> findByReviewRequestId(UUID reviewRequestId);
}
