package com.example.backend.ai.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

interface AiOperationRepository extends JpaRepository<AiOperationEntity, UUID> {

	@Query("select coalesce(sum(operation.chargedCostUsd), 0) from AiOperationEntity operation "
			+ "where operation.createdAt >= :since")
	BigDecimal chargedCostSince(@Param("since") Instant since);
}
