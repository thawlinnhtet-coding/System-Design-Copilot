package com.example.backend.architecture.infrastructure;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface ArchitectureRevisionRepository extends JpaRepository<ArchitectureRevisionEntity, UUID> { Optional<ArchitectureRevisionEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId); }
