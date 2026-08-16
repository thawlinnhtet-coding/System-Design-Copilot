package com.example.backend.ai.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persists cost and provider outcomes independently of a caller's request
 * transaction. This keeps the beta spend stop and its safe audit trail intact
 * when a browser request is rolled back after an upstream provider call.
 */
@Service
class AiOperationAuditService {

	private final AiOperationStore operationStore;

	AiOperationAuditService(AiOperationStore operationStore) {
		this.operationStore = operationStore;
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public AiOperation record(AiOperation operation) {
		return operationStore.save(operation);
	}
}
