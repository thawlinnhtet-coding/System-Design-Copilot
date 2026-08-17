package com.example.backend.identity.application;

import java.time.Instant;
import java.util.UUID;

public interface AccountDeletionStore {
	void recordTombstone(UUID userId, Instant deletedAt);
}
