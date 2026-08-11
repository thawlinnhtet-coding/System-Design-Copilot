package com.example.backend.reasoning.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReviewBriefRepository extends JpaRepository<ReviewBriefEntity, UUID> {
	void deleteByWorkspaceId(UUID workspaceId);
	Optional<ReviewBriefEntity> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);
}
