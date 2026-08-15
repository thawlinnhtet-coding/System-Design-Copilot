package com.example.backend.review.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface ReviewJobRepository extends JpaRepository<ReviewJobEntity, UUID> {
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<ReviewJobEntity> findLockedById(UUID id);
	Optional<ReviewJobEntity> findByReviewRequestId(UUID requestId);
}
