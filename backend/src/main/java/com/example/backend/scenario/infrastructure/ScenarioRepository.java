package com.example.backend.scenario.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ScenarioRepository extends JpaRepository<ScenarioEntity, UUID> {
	List<ScenarioEntity> findAllByWorkspaceIdAndUserIdOrderByOrderIndexAsc(UUID workspaceId, UUID userId);
	Optional<ScenarioEntity> findByIdAndWorkspaceIdAndUserId(UUID id, UUID workspaceId, UUID userId);
	List<ScenarioEntity> findAllByWorkspaceIdAndUserIdAndStatusOrderByOrderIndexAsc(UUID workspaceId, UUID userId, ScenarioStatus status);
}
