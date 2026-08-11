package com.example.backend.reasoning.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RequirementRepository extends JpaRepository<RequirementEntity, UUID> {
	void deleteAllByWorkspaceId(UUID workspaceId);
	List<RequirementEntity> findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(UUID workspaceId, UUID userId);
	Optional<RequirementEntity> findByIdAndWorkspaceIdAndUserId(UUID id, UUID workspaceId, UUID userId);
	long countByIdInAndWorkspaceIdAndUserId(List<UUID> ids, UUID workspaceId, UUID userId);
}
