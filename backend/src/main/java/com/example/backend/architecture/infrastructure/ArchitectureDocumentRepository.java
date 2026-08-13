package com.example.backend.architecture.infrastructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.UUID;
public interface ArchitectureDocumentRepository extends JpaRepository<ArchitectureDocumentEntity, UUID> {
	@Modifying
	@Query("update ArchitectureDocumentEntity document set document.version = document.version + 1, document.document = :content, document.updatedAt = :updatedAt where document.workspaceId = :workspaceId and document.version = :expectedVersion")
	int replaceIfVersionMatches(@Param("workspaceId") UUID workspaceId, @Param("expectedVersion") long expectedVersion, @Param("content") String content, @Param("updatedAt") Instant updatedAt);
}
