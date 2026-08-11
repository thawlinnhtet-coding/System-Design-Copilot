package com.example.backend.reasoning.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssumptionRepository extends JpaRepository<AssumptionEntity, UUID> {
	void deleteAllByWorkspaceId(UUID workspaceId);
	List<AssumptionEntity> findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(UUID workspaceId, UUID userId);
	Optional<AssumptionEntity> findByIdAndWorkspaceIdAndUserId(UUID id, UUID workspaceId, UUID userId);
	long countByIdInAndWorkspaceIdAndUserId(List<UUID> ids, UUID workspaceId, UUID userId);
}
