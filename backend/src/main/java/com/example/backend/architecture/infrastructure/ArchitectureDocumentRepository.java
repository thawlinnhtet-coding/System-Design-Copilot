package com.example.backend.architecture.infrastructure;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ArchitectureDocumentRepository extends JpaRepository<ArchitectureDocumentEntity, UUID> { }
