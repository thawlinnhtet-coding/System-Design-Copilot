package com.example.backend.scenario.application;

import java.util.UUID;

public interface ScenarioSnapshotProvider {
	String completedSnapshotForRevision(UUID userId, UUID workspaceId);
}
