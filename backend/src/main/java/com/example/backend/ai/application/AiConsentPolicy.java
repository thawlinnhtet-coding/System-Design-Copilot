package com.example.backend.ai.application;

import java.util.List;

public record AiConsentPolicy(String version) {

	public static final List<String> INCLUDED_CATEGORIES = List.of(
			"Current Workspace Requirements, Assumptions, Decisions, and Architecture Document",
			"The current Review Revision or active Scenario relevant to the requested operation"
	);
	public static final List<String> EXCLUDED_CATEGORIES = List.of(
			"Credentials, tokens, passwords, and authentication metadata",
			"Account, billing, usage, and identity data",
			"Unrelated Workspaces",
			"Raw provider payloads and operational secrets"
	);

	public AiConsentPolicy {
		if (version == null || version.isBlank()) {
			throw new IllegalArgumentException("AI consent policy version must not be blank");
		}
	}

	public boolean accepts(String requestedVersion) {
		return version.equals(requestedVersion);
	}
}
