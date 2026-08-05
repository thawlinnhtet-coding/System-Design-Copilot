package com.example.backend.entitlement.application;

import java.time.Instant;
import java.util.UUID;

public interface UsageRecordStore {

	long countSince(UUID userId, UsageOperation operation, Instant monthStart);

	boolean exists(UUID userId, UsageOperation operation, UUID operationId);

	void record(UUID userId, UsageOperation operation, UUID operationId, Instant recordedAt);

}
