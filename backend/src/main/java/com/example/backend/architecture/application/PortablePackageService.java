package com.example.backend.architecture.application;

import com.example.backend.reasoning.application.PortableReasoningProvider;
import com.example.backend.workspace.application.WorkspaceAccess;
import com.example.backend.workspace.application.WorkspaceMetadataProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PortablePackageService {
	private static final Set<String> EXCLUDED_KEYS = Set.of("ownerId", "userId", "workspaceId", "plan", "billing", "usage", "usageRecords", "review", "reviews", "provider", "providerMetadata", "audit", "createdAt", "updatedAt");
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final PortablePackageValidator validator;
	private final ArchitectureDocumentService documentService;
	private final WorkspaceAccess workspaceAccess;
	private final WorkspaceMetadataProvider workspaceMetadata;
	private final PortableReasoningProvider reasoning;

	public PortablePackageService(
			PortablePackageValidator validator,
			ArchitectureDocumentService architectureDocuments,
			WorkspaceAccess workspaceAccess,
			WorkspaceMetadataProvider workspaceMetadata,
			PortableReasoningProvider reasoning
	) {
		this.validator = validator;
		this.documentService = architectureDocuments;
		this.workspaceAccess = workspaceAccess;
		this.workspaceMetadata = workspaceMetadata;
		this.reasoning = reasoning;
	}

	@Transactional(readOnly = true)
	public ImportResponse validateImport(UUID userId, JsonNode packageNode) {
		var result = validator.validate(packageNode);
		if (result.valid()) {
			try {
				documentService.validateForPortableImport(packageNode.path("workspace").path("architecture"));
			} catch (ArchitectureDocumentService.InvalidArchitectureDocumentException exception) {
				throw new InvalidPortablePackageException(List.of(new PortablePackageValidator.ValidationError(
						"/workspace/architecture", exception.getMessage(), "Correct the Architecture Document and validate the package again.")));
			}
			return response(result.packageNode());
		}
		throw new InvalidPortablePackageException(result.errors());
	}

	@Transactional(readOnly = true)
	public ImportResponse export(UUID userId, UUID workspaceId) {
		workspaceAccess.requireOwned(userId, workspaceId);
		var metadata = workspaceMetadata.ownedMetadata(userId, workspaceId);
		var document = documentService.get(userId, workspaceId).document();
		var snapshot = reasoning.portableSnapshot(userId, workspaceId);
		var root = objectMapper.createObjectNode();
		root.put("format", "system-design-copilot");
		root.put("schemaVersion", 1);
		var workspace = root.putObject("workspace");
		workspace.put("title", metadata.name());
		workspace.set("requirements", requirements(snapshot.requirements()));
		workspace.set("assumptions", assumptions(snapshot.assumptions()));
		workspace.set("decisions", decisions(snapshot.decisions()));
		workspace.set("architecture", sanitize(document));
		return response(root);
	}

	private ArrayNode requirements(List<PortableReasoningProvider.PortableRequirement> values) {
		var array = objectMapper.createArrayNode();
		for (var value : values) {
			var node = array.addObject();
			put(node, "kind", value.kind()); put(node, "statement", value.statement()); put(node, "priority", value.priority()); put(node, "status", value.status()); put(node, "measurableTarget", value.measurableTarget()); put(node, "rationale", value.rationale()); put(node, "source", value.source());
		}
		return array;
	}

	private ArrayNode assumptions(List<PortableReasoningProvider.PortableAssumption> values) {
		var array = objectMapper.createArrayNode();
		for (var value : values) {
			var node = array.addObject();
			put(node, "category", value.category()); put(node, "quantitativeValue", value.quantitativeValue()); put(node, "unit", value.unit()); put(node, "rationale", value.rationale()); put(node, "confidence", value.confidence()); put(node, "status", value.status()); put(node, "source", value.source());
		}
		return array;
	}

	private ArrayNode decisions(List<PortableReasoningProvider.PortableDecision> values) {
		var array = objectMapper.createArrayNode();
		for (var value : values) {
			var node = array.addObject();
			put(node, "title", value.title()); put(node, "chosenOption", value.chosenOption()); put(node, "rationale", value.rationale()); put(node, "alternatives", value.alternatives()); put(node, "positiveConsequences", value.positiveConsequences()); put(node, "risks", value.risks()); put(node, "status", value.status());
			node.set("evidenceRefs", objectMapper.valueToTree(value.evidenceRefs()));
		}
		return array;
	}

	private JsonNode sanitize(JsonNode value) {
		if (value == null || value.isNull()) return objectMapper.nullNode();
		if (value.isArray()) {
			var array = objectMapper.createArrayNode();
			for (var child : value) array.add(sanitize(child));
			return array;
		}
		if (!value.isObject()) return value;
		var object = objectMapper.createObjectNode();
		value.properties().forEach(entry -> { if (!EXCLUDED_KEYS.contains(entry.getKey())) object.set(entry.getKey(), sanitize(entry.getValue())); });
		return object;
	}

	private void put(ObjectNode node, String name, String value) { if (value != null) node.put(name, value); }
	private ImportResponse response(JsonNode packageNode) {
		var workspace = packageNode.path("workspace");
		var architecture = workspace.path("architecture");
		var preview = new PortablePreview(
				workspace.path("title").asText(),
				workspace.path("requirements").size(), workspace.path("assumptions").size(), workspace.path("decisions").size(),
				architecture.path("components").size(), architecture.path("connections").size(),
				objectMapper.writeValueAsString(packageNode).getBytes(StandardCharsets.UTF_8).length);
		return new ImportResponse(packageNode, preview);
	}

	public record ImportResponse(JsonNode packageNode, PortablePreview preview) { }
	public record PortablePreview(String title, int requirements, int assumptions, int decisions, int components, int connections, int bytes) { }
	public static class InvalidPortablePackageException extends RuntimeException {
		private final List<PortablePackageValidator.ValidationError> errors;
		public InvalidPortablePackageException(List<PortablePackageValidator.ValidationError> errors) { super("The Import Package is not valid"); this.errors = errors; }
		public List<PortablePackageValidator.ValidationError> errors() { return errors; }
	}
}
