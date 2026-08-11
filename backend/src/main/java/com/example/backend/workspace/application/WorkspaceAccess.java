package com.example.backend.workspace.application;

import java.util.UUID;

/** Application boundary for features that need to authorize Workspace access. */
public interface WorkspaceAccess {

	void requireOwned(UUID userId, UUID workspaceId);

	void requireEditable(UUID userId, UUID workspaceId);
}
