package com.example.backend.identity.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

interface AccountDeletionRequestRepository extends JpaRepository<AccountDeletionRequestEntity, UUID> {
	List<AccountDeletionRequestEntity> findAllByRecoveryEndsAtLessThanEqual(Instant value);
}
