package com.example.backend.entitlement.infrastructure;

import com.example.backend.entitlement.application.UsageOperation;
import com.example.backend.entitlement.application.UsageRecordStore;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
class JpaUsageRecordStore implements UsageRecordStore {

	private final UsageRecordRepository usageRecordRepository;

	JpaUsageRecordStore(UsageRecordRepository usageRecordRepository) {
		this.usageRecordRepository = usageRecordRepository;
	}

	@Override
	public long countSince(UUID userId, UsageOperation operation, Instant monthStart) {
		return usageRecordRepository.countByUserIdAndOperationAndRecordedAtGreaterThanEqual(userId, operation, monthStart);
	}

	@Override
	public boolean exists(UUID userId, UsageOperation operation, UUID operationId) {
		return usageRecordRepository.existsByUserIdAndOperationAndOperationId(userId, operation, operationId);
	}

	@Override
	public void record(UUID userId, UsageOperation operation, UUID operationId, Instant recordedAt) {
		usageRecordRepository.save(new UsageRecordEntity(userId, operation, operationId, recordedAt));
	}

}
