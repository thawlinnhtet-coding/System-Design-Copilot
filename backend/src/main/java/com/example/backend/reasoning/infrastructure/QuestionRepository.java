package com.example.backend.reasoning.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<QuestionEntity, UUID> {
	void deleteAllByWorkspaceId(UUID workspaceId);
	List<QuestionEntity> findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(UUID workspaceId, UUID userId);
	Optional<QuestionEntity> findByIdAndWorkspaceIdAndUserId(UUID id, UUID workspaceId, UUID userId);
}
