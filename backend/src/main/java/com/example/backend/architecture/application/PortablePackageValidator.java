package com.example.backend.architecture.application;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** Validates the ownership-independent JSON envelope used by import and export. */
@Component
public final class PortablePackageValidator {
	public static final int MAX_BYTES = 1_048_576;
	private static final Set<String> SERVER_OWNED_KEYS = Set.of(
			"ownerId", "userId", "workspaceId", "plan", "billing", "usage", "usageRecords", "review", "reviews",
			"provider", "providerMetadata", "audit", "createdAt", "updatedAt", "password", "secret", "token",
			"credential", "apiKey");
	private static final Set<String> ROOT_KEYS = Set.of("format", "schemaVersion", "workspace");
	private static final Set<String> WORKSPACE_KEYS = Set.of("title", "requirements", "assumptions", "decisions", "architecture");
	private static final Set<String> ARCHITECTURE_KEYS = Set.of("schemaVersion", "components", "connections", "boundaries", "viewport");
	private static final Set<String> REQUIREMENT_KEYS = Set.of("kind", "statement", "priority", "status", "measurableTarget", "rationale", "source");
	private static final Set<String> ASSUMPTION_KEYS = Set.of("category", "quantitativeValue", "unit", "rationale", "confidence", "status", "source");
	private static final Set<String> DECISION_KEYS = Set.of("title", "chosenOption", "rationale", "alternatives", "positiveConsequences", "risks", "status", "evidenceRefs");

	private final ObjectMapper objectMapper;

	public PortablePackageValidator(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public ValidationResult validate(JsonNode value) {
		var errors = new ArrayList<ValidationError>();
		long bytes = serializedBytes(value);
		if (bytes > MAX_BYTES) {
			errors.add(new ValidationError("$", "The package is larger than 1 MiB.", "Remove unused content and try again."));
		}
		if (value == null || !value.isObject()) {
			errors.add(new ValidationError("$", "The package must be a JSON object.", "Choose a System Design Copilot JSON package."));
			return invalid(errors);
		}
		collectForbiddenKeys(value, "$", errors);
		collectUnsafeText(value, "$", errors);
		checkAllowedKeys(value, ROOT_KEYS, "$", errors);
		if (!"system-design-copilot".equals(value.path("format").asText())) {
			errors.add(new ValidationError("/format", "The package format is unsupported.", "Set format to system-design-copilot."));
		}
		if (value.path("schemaVersion").asInt(-1) != 1) {
			errors.add(new ValidationError("/schemaVersion", "Only schema version 1 is supported.", "Export a new package or change schemaVersion to 1."));
		}
		var workspace = value.get("workspace");
		if (workspace == null || !workspace.isObject()) {
			errors.add(new ValidationError("/workspace", "workspace must be an object.", "Add the portable workspace content."));
			return invalid(errors);
		}
		checkAllowedKeys(workspace, WORKSPACE_KEYS, "/workspace", errors);
		if (!workspace.path("title").isTextual() || workspace.path("title").asText().isBlank() || workspace.path("title").asText().length() > 120) {
			errors.add(new ValidationError("/workspace/title", "The workspace title is required and must be at most 120 characters.", "Provide a short workspace title."));
		}
		validateRecords(workspace, "requirements", REQUIREMENT_KEYS, 200, errors);
		validateRecords(workspace, "assumptions", ASSUMPTION_KEYS, 200, errors);
		validateRecords(workspace, "decisions", DECISION_KEYS, 200, errors);
		var architecture = workspace.get("architecture");
		if (architecture == null || !architecture.isObject()) {
			errors.add(new ValidationError("/workspace/architecture", "architecture must be an object.", "Include a schema-versioned Architecture Document."));
		} else {
			checkAllowedKeys(architecture, ARCHITECTURE_KEYS, "/workspace/architecture", errors);
		}
		return errors.isEmpty() ? new ValidationResult(value, List.of()) : invalid(errors);
	}

	private void validateRecords(JsonNode workspace, String field, Set<String> allowedKeys, int max, List<ValidationError> errors) {
		var values = workspace.get(field);
		if (values == null || !values.isArray() || values.size() > max) {
			errors.add(new ValidationError("/workspace/" + field, "The field must be an array with at most " + max + " entries.", "Remove entries until the package is within the supported limit."));
			return;
		}
		for (int i = 0; i < values.size(); i++) {
			var path = "/workspace/" + field + "/" + i;
			if (!values.get(i).isObject()) {
				errors.add(new ValidationError(path, "The entry must be an object.", "Export the record from a supported Workspace."));
				continue;
			}
			checkAllowedKeys(values.get(i), allowedKeys, path, errors);
		}
	}

	private void checkAllowedKeys(JsonNode node, Set<String> allowed, String path, List<ValidationError> errors) {
		node.properties().forEach(entry -> {
			if (!allowed.contains(entry.getKey()) && !SERVER_OWNED_KEYS.contains(entry.getKey())) {
				errors.add(new ValidationError(path + "/" + escape(entry.getKey()), "This field is not part of the portable format.", "Remove the unsupported field."));
			}
		});
	}

	private void collectForbiddenKeys(JsonNode node, String path, List<ValidationError> errors) {
		if (node.isObject()) {
			node.properties().forEach(entry -> {
				var childPath = path.equals("$") ? "/" + escape(entry.getKey()) : path + "/" + escape(entry.getKey());
				if (SERVER_OWNED_KEYS.contains(entry.getKey())) {
					errors.add(new ValidationError(childPath, "Server-owned content cannot be imported.", "Remove this field; ownership, billing, usage, provider, and Review state are created by the server."));
				}
				collectForbiddenKeys(entry.getValue(), childPath, errors);
			});
		} else if (node.isArray()) {
			for (int i = 0; i < node.size(); i++) collectForbiddenKeys(node.get(i), path + "/" + i, errors);
		}
	}

	private void collectUnsafeText(JsonNode node, String path, List<ValidationError> errors) {
		if (node.isTextual() && node.asText().matches("(?is).*<\\s*script\\b.*|.*javascript\\s*:.*|.*<\\s*iframe\\b.*|.*on[a-z]+\\s*=.*")) {
			errors.add(new ValidationError(path, "The text contains unsafe markup or a script URL.", "Remove executable markup and URLs from the content."));
		} else if (node.isObject()) {
			node.properties().forEach(entry -> collectUnsafeText(entry.getValue(), childPath(path, entry.getKey()), errors));
		} else if (node.isArray()) {
			for (int i = 0; i < node.size(); i++) collectUnsafeText(node.get(i), path.equals("$") ? "/" + i : path + "/" + i, errors);
		}
	}

	private String childPath(String path, String key) {
		return path.equals("$") ? "/" + escape(key) : path + "/" + escape(key);
	}

	private long serializedBytes(JsonNode value) {
		try { return objectMapper.writeValueAsString(value).getBytes(StandardCharsets.UTF_8).length; }
		catch (JacksonException exception) { return Long.MAX_VALUE; }
	}

	private String escape(String value) { return value.replace("~", "~0").replace("/", "~1"); }
	private ValidationResult invalid(List<ValidationError> errors) { return new ValidationResult(null, List.copyOf(errors)); }

	public record ValidationResult(JsonNode packageNode, List<ValidationError> errors) {
		public boolean valid() { return packageNode != null && errors.isEmpty(); }
	}
	public record ValidationError(String path, String reason, String correction) { }
}
