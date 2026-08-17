package com.example.backend.review.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.time.Instant;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewOutboxEventRepository extends JpaRepository<ReviewOutboxEventEntity, UUID> {
	@Query(value="select * from review_outbox_events where (status = 'PENDING' or status = 'CLAIMED') and (lease_expires_at is null or lease_expires_at < :now) order by created_at asc limit 50", nativeQuery=true)
	List<ReviewOutboxEventEntity> findClaimable(@Param("now") Instant now);
	@Modifying
	@Query("update ReviewOutboxEventEntity e set e.status = 'CLAIMED', e.leaseOwner = :owner, e.leaseExpiresAt = :expiresAt where e.id = :id and (e.status = 'PENDING' or e.status = 'CLAIMED') and (e.leaseExpiresAt is null or e.leaseExpiresAt < :now)")
	int claim(@Param("id") UUID id, @Param("owner") String owner, @Param("now") Instant now, @Param("expiresAt") Instant expiresAt);
	@Modifying
	@Query("update ReviewOutboxEventEntity e set e.status = 'PUBLISHED', e.publishedAt = :publishedAt, e.leaseOwner = null, e.leaseExpiresAt = null where e.id = :id and e.status = 'CLAIMED' and e.leaseOwner = :owner")
	int markPublished(@Param("id") UUID id, @Param("owner") String owner, @Param("publishedAt") Instant publishedAt);
	@Modifying
	@Query("update ReviewOutboxEventEntity e set e.status = 'PENDING', e.leaseOwner = null, e.leaseExpiresAt = null where e.id = :id and e.status = 'CLAIMED' and e.leaseOwner = :owner")
	int release(@Param("id") UUID id, @Param("owner") String owner);
	Optional<ReviewOutboxEventEntity> findByReviewJobId(UUID reviewJobId);
}
