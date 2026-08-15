package com.example.backend.scenario.application;

import java.util.UUID;

public interface ScenarioWorkspaceContextProvider {
	ScenarioWorkspaceContext scenarioContext(UUID userId, UUID workspaceId);

	record ScenarioWorkspaceContext(String name, String description, String challengeSnapshot) { }
}
