package com.example.backend.reasoning.application;

import java.util.List;
import java.util.UUID;

/** Exposes only user-authored reasoning fields to the Architecture portability boundary. */
public interface PortableReasoningProvider {
	PortableReasoningSnapshot portableSnapshot(UUID userId, UUID workspaceId);

	record PortableReasoningSnapshot(
			List<PortableRequirement> requirements,
			List<PortableAssumption> assumptions,
			List<PortableDecision> decisions
	) { }

	record PortableRequirement(String kind, String statement, String priority, String status, String measurableTarget, String rationale, String source) { }
	record PortableAssumption(String category, String quantitativeValue, String unit, String rationale, String confidence, String status, String source) { }
	record PortableDecision(String title, String chosenOption, String rationale, String alternatives, String positiveConsequences, String risks, String status, List<String> evidenceRefs) { }
}
