package com.example.backend.ai.application;

import com.example.backend.workspace.application.WorkspaceAccess;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AiOperationAuthorizer {

	private final WorkspaceAccess workspaceAccess;
	private final AiConsentService consentService;

	public AiOperationAuthorizer(WorkspaceAccess workspaceAccess, AiConsentService consentService) {
		this.workspaceAccess = workspaceAccess;
		this.consentService = consentService;
	}

	public void requireAuthorized(UUID userId, UUID workspaceId) {
		workspaceAccess.requireOwned(userId, workspaceId);
		consentService.requireCurrent(userId);
	}
}
