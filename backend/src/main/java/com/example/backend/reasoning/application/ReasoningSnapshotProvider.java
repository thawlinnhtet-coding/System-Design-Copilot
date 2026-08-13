package com.example.backend.reasoning.application;

import java.util.UUID;

/** Provides the bounded reasoning context captured by an immutable Architecture Revision. */
public interface ReasoningSnapshotProvider {
	String snapshotForRevision(UUID userId, UUID workspaceId);
}
