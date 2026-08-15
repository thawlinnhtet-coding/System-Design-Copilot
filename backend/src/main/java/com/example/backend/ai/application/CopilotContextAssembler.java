package com.example.backend.ai.application;

import com.example.backend.architecture.application.ArchitectureDocumentService;
import com.example.backend.reasoning.application.ReasoningService;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

/** Builds a deliberately small, data-only view of one owned Workspace. */
@Service
public class CopilotContextAssembler {

	private static final int MAX_FIELD_LENGTH = 2_000;
	private final CopilotWorkspaceContextProvider workspaces;
	private final ReasoningService reasoning;
	private final ArchitectureDocumentService architecture;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public CopilotContextAssembler(CopilotWorkspaceContextProvider workspaces, ReasoningService reasoning, ArchitectureDocumentService architecture) {
		this.workspaces = workspaces;
		this.reasoning = reasoning;
		this.architecture = architecture;
	}

	public AiBoundedContext assemble(UUID userId, UUID workspaceId, String userQuestion) {
		var workspace = workspaces.loadForCopilot(userId, workspaceId);
		var root = objectMapper.createObjectNode();
		root.put("instruction", "Give advisory questions, trade-offs, and explanations. Never propose a complete reference architecture or edits.");
		root.put("userQuestion", bounded(userQuestion));
		var workspaceNode = root.putObject("workspace");
		workspaceNode.put("name", bounded(workspace.name()));
		workspaceNode.put("description", bounded(workspace.description()));
		root.set("reasoning", safeReasoning(reasoning.get(userId, workspaceId)));
		root.set("architecture", safeArchitecture(architecture.get(userId, workspaceId).document()));
		if (workspace.challengeSnapshot() != null && !workspace.challengeSnapshot().isBlank()) {
			root.set("challenge", safeChallenge(workspace.challengeSnapshot()));
		}
		return new AiBoundedContext(workspaceId, objectMapper.writeValueAsString(root));
	}

	private JsonNode safeReasoning(ReasoningService.ReasoningResponse source) {
		var node = objectMapper.createObjectNode();
		var requirements = node.putArray("requirements");
		for (var value : source.requirements()) { var item = requirements.addObject(); item.put("kind", value.kind()); item.put("statement", bounded(value.statement())); item.put("target", bounded(value.measurableTarget())); }
		var assumptions = node.putArray("assumptions");
		for (var value : source.assumptions()) { var item = assumptions.addObject(); item.put("category", value.category()); item.put("value", bounded(value.quantitativeValue())); item.put("unit", bounded(value.unit())); item.put("rationale", bounded(value.rationale())); }
		var decisions = node.putArray("decisions");
		for (var value : source.decisions()) { var item = decisions.addObject(); item.put("title", bounded(value.title())); item.put("chosenOption", bounded(value.chosenOption())); item.put("rationale", bounded(value.rationale())); item.put("risks", bounded(value.risks())); }
		var questions = node.putArray("openQuestions");
		for (var value : source.questions()) { var item = questions.addObject(); item.put("question", bounded(value.question())); item.put("whyItMatters", bounded(value.whyItMatters())); }
		return node;
	}

	private JsonNode safeArchitecture(JsonNode source) {
		var node = objectMapper.createObjectNode();
		var components = node.putArray("components");
		for (var value : source.path("components")) { var item = components.addObject(); copy(value, item, "id", "category", "type", "label", "boundaryId"); item.set("properties", value.path("properties")); }
		var connections = node.putArray("connections");
		for (var value : source.path("connections")) { var item = connections.addObject(); copy(value, item, "id", "fromComponentId", "toComponentId", "intent", "protocol", "guarantee", "notes"); }
		var boundaries = node.putArray("boundaries");
		for (var value : source.path("boundaries")) { var item = boundaries.addObject(); copy(value, item, "id", "label", "type", "parentBoundaryId"); item.set("componentIds", value.path("componentIds")); }
		return node;
	}

	private JsonNode safeChallenge(String snapshot) {
		try {
			var source = objectMapper.readTree(snapshot);
			var node = objectMapper.createObjectNode();
			copy(source, node, "version", "title", "description", "problemStatement", "difficulty", "estimatedMinutes");
			node.set("initialConstraints", source.path("initialConstraints"));
			node.set("skillCoverage", source.path("skillCoverage"));
			return node;
		} catch (RuntimeException exception) {
			throw new IllegalStateException("Stored Challenge snapshot is invalid", exception);
		}
	}

	private void copy(JsonNode source, tools.jackson.databind.node.ObjectNode target, String... names) {
		for (var name : names) if (!source.path(name).isMissingNode() && !source.path(name).isNull()) target.put(name, bounded(source.path(name).asText()));
	}

	private String bounded(String value) { return value == null ? "" : value.substring(0, Math.min(value.length(), MAX_FIELD_LENGTH)); }
}
