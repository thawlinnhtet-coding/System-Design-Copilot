package com.example.backend.workspace.application;

import java.util.UUID;

public interface WorkspaceMetadataProvider {
	WorkspaceMetadata ownedMetadata(UUID userId, UUID workspaceId);

	record WorkspaceMetadata(UUID id, String name) { }
}
