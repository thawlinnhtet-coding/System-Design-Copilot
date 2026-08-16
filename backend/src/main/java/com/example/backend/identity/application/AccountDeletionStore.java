package com.example.backend.identity.application;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountDeletionStore {
	Optional<Request> findByUserId(UUID userId);
	List<Request> findExpired(Instant now);
	void save(Request request);
	void delete(UUID userId);
	void recordTombstone(UUID userId, Instant deletedAt);
	record Request(UUID userId, byte[] cancellationTokenHash, Instant requestedAt, Instant recoveryEndsAt) { }
}
