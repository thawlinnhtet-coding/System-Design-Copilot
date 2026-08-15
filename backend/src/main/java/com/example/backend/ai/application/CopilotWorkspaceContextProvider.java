package com.example.backend.ai.application;

import java.util.UUID;

/** Minimal Workspace-owned data allowed into Copilot context. */
public interface CopilotWorkspaceContextProvider {

	CopilotWorkspaceContext loadForCopilot(UUID userId, UUID workspaceId);

	record CopilotWorkspaceContext(UUID workspaceId, String name, String description, String challengeSnapshot) { }
}
