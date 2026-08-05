package com.example.backend.billing.infrastructure;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

interface StripeSubscriptionRepository extends JpaRepository<StripeSubscriptionEntity, UUID> {
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select subscription from StripeSubscriptionEntity subscription where subscription.userId = :userId")
	Optional<StripeSubscriptionEntity> findByUserIdForUpdate(UUID userId);
}
