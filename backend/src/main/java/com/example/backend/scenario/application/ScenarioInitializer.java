package com.example.backend.scenario.application;

import java.util.UUID;

public interface ScenarioInitializer {
	void initializeCurated(UUID userId, UUID workspaceId, String challengeSnapshot);
}
