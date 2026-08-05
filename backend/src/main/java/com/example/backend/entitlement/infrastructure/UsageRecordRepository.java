package com.example.backend.entitlement.infrastructure;

import com.example.backend.entitlement.application.UsageOperation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

interface UsageRecordRepository extends JpaRepository<UsageRecordEntity, UUID> {

	long countByUserIdAndOperationAndRecordedAtGreaterThanEqual(UUID userId, UsageOperation operation, Instant recordedAt);

	boolean existsByUserIdAndOperationAndOperationId(UUID userId, UsageOperation operation, UUID operationId);

}
