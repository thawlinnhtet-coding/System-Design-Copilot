package com.example.backend.identity.infrastructure;

import com.example.backend.identity.application.AccountDeletionStore;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.UUID;

@Component
class JpaAccountDeletionStore implements AccountDeletionStore {
	private final AccountDeletionTombstoneRepository tombstones;
	JpaAccountDeletionStore(AccountDeletionTombstoneRepository tombstones) { this.tombstones = tombstones; }
	public void recordTombstone(UUID userId, Instant deletedAt) { tombstones.save(new AccountDeletionTombstoneEntity(deletedAt)); }
}
