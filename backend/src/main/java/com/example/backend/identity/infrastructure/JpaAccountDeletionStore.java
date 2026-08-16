package com.example.backend.identity.infrastructure;

import com.example.backend.identity.application.AccountDeletionStore;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
class JpaAccountDeletionStore implements AccountDeletionStore {
	private final AccountDeletionRequestRepository requests;
	private final AccountDeletionTombstoneRepository tombstones;
	JpaAccountDeletionStore(AccountDeletionRequestRepository requests, AccountDeletionTombstoneRepository tombstones) { this.requests = requests; this.tombstones = tombstones; }
	public Optional<Request> findByUserId(UUID userId) { return requests.findById(userId).map(this::request); }
	public List<Request> findExpired(Instant now) { return requests.findAllByRecoveryEndsAtLessThanEqual(now).stream().map(this::request).toList(); }
	public void save(Request value) { requests.save(new AccountDeletionRequestEntity(value.userId(), value.cancellationTokenHash(), value.requestedAt(), value.recoveryEndsAt())); }
	public void delete(UUID userId) { requests.deleteById(userId); }
	public void recordTombstone(UUID userId, Instant deletedAt) { tombstones.save(new AccountDeletionTombstoneEntity(deletedAt)); }
	private Request request(AccountDeletionRequestEntity value) { return new Request(value.getUserId(), value.getCancellationTokenHash(), value.getRequestedAt(), value.getRecoveryEndsAt()); }
}
