package com.example.backend.reasoning.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DecisionRepository extends JpaRepository<DecisionEntity, UUID> {
	void deleteAllByWorkspaceId(UUID workspaceId);
	List<DecisionEntity> findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(UUID workspaceId, UUID userId);
	Optional<DecisionEntity> findByIdAndWorkspaceIdAndUserId(UUID id, UUID workspaceId, UUID userId);
}
