package com.example.backend.identity.infrastructure;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
interface AccountDeletionTombstoneRepository extends JpaRepository<AccountDeletionTombstoneEntity, UUID> { }
