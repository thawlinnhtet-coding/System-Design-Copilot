package com.example.backend.workspace.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<WorkspaceEntity, UUID> {

	List<WorkspaceEntity> findAllByUserIdOrderByUpdatedAtDesc(UUID userId);

	Optional<WorkspaceEntity> findByIdAndUserId(UUID id, UUID userId);
}
