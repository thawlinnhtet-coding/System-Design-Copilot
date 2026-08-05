package com.example.backend.entitlement.application;

import java.util.UUID;

public interface UserAllowanceStore {

	int activeWorkspaceCount(UUID userId);

	int activeWorkspaceCountForUpdate(UUID userId);

	void updateActiveWorkspaceCount(UUID userId, int activeWorkspaceCount);

}
