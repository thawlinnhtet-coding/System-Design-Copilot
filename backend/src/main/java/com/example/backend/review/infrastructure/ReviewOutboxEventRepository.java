package com.example.backend.review.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ReviewOutboxEventRepository extends JpaRepository<ReviewOutboxEventEntity, UUID> {
	List<ReviewOutboxEventEntity> findTop50ByStatusOrderByCreatedAtAsc(String status);
}
