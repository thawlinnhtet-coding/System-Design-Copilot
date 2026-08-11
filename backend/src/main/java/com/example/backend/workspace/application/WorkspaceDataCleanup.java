package com.example.backend.workspace.application;

import java.util.UUID;

/** Application port used by Workspace lifecycle operations to remove feature-owned data. */
public interface WorkspaceDataCleanup {

	void deleteForWorkspace(UUID workspaceId);
}
