package com.example.backend.ai.application;

import java.util.UUID;

/** Context assembled by an owning Workspace use case; prompts are never persisted by the AI boundary. */
public record AiBoundedContext(UUID workspaceId, String text) {

	public AiBoundedContext {
		if (workspaceId == null) {
			throw new IllegalArgumentException("AI context must identify one Workspace");
		}
		if (text == null || text.isBlank()) {
			throw new IllegalArgumentException("AI context must not be blank");
		}
		if (text.length() > 20_000) {
			throw new IllegalArgumentException("AI context exceeds the bounded context limit");
		}
	}
}
