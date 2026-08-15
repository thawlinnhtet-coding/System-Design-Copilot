package com.example.backend.architecture.application;

import com.example.backend.architecture.infrastructure.ArchitectureDocumentEntity;
import com.example.backend.architecture.infrastructure.ArchitectureDocumentRepository;
import com.example.backend.architecture.infrastructure.ArchitectureRevisionEntity;
import com.example.backend.architecture.infrastructure.ArchitectureRevisionRepository;
import com.example.backend.workspace.application.WorkspaceAccess;
import com.example.backend.reasoning.application.ReasoningSnapshotProvider;
import com.example.backend.scenario.application.ScenarioSnapshotProvider;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.UUID;

@Service
public class ArchitectureDocumentService {
	private static final int SCHEMA_VERSION = 1;
	private static final Set<String> CATEGORIES = Set.of("COMPUTE", "DATA_STORE", "MESSAGING", "EDGE_SECURITY", "IDENTITY_SECRETS", "OBSERVABILITY", "CUSTOM");
	private static final Set<String> COMPONENT_TYPES = Set.of("SERVICE", "FUNCTION", "BATCH_JOB", "RELATIONAL_DATABASE", "DOCUMENT_DATABASE", "CACHE", "OBJECT_STORE", "QUEUE", "STREAM", "GATEWAY", "LOAD_BALANCER", "WAF", "IDENTITY_PROVIDER", "SECRETS_MANAGER", "LOGGING", "METRICS", "TRACING", "EXTERNAL_API", "CUSTOM_COMPONENT");
	private static final Set<String> CONNECTION_INTENTS = Set.of("REQUEST_RESPONSE", "DNS_RESOLUTION", "DATA_READ_WRITE", "EVENT_PUBLISH", "EVENT_CONSUME", "QUEUE_DELIVERY", "STREAM", "REPLICATION", "AUTHENTICATION", "FILE_OBJECT_TRANSFER");
	private static final Set<String> PROTOCOLS = Set.of("HTTP", "HTTPS", "GRPC", "TCP", "UDP", "AMQP", "KAFKA", "SQL", "REDIS", "DNS", "S3");
	private static final Set<String> GUARANTEES = Set.of("BEST_EFFORT", "AT_MOST_ONCE", "AT_LEAST_ONCE", "EXACTLY_ONCE", "STRONG", "EVENTUAL");
	private static final Set<String> BOUNDARY_TYPES = Set.of("DEPLOYMENT", "NETWORK", "REGION", "AVAILABILITY", "TRUST");
	private final WorkspaceAccess workspaceAccess;
	private final ArchitectureDocumentRepository documents;
	private final ArchitectureRevisionRepository revisions;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final Clock clock;
	private final ReasoningSnapshotProvider reasoningSnapshotProvider;
	private final ScenarioSnapshotProvider scenarioSnapshotProvider;

	public ArchitectureDocumentService(WorkspaceAccess workspaceAccess, ArchitectureDocumentRepository documents, ArchitectureRevisionRepository revisions, ReasoningSnapshotProvider reasoningSnapshotProvider, ScenarioSnapshotProvider scenarioSnapshotProvider, Clock clock) {
		this.workspaceAccess = workspaceAccess; this.documents = documents; this.revisions = revisions; this.reasoningSnapshotProvider = reasoningSnapshotProvider; this.scenarioSnapshotProvider = scenarioSnapshotProvider; this.clock = clock;
	}

	@Transactional(readOnly = true)
	public DocumentResponse get(UUID userId, UUID workspaceId) {
		workspaceAccess.requireOwned(userId, workspaceId);
		return documents.findById(workspaceId).map(this::response).orElseGet(() -> new DocumentResponse(workspaceId, 0, emptyDocument(), null));
	}

	/** Validates an imported document without attaching ownership or persisting anything. */
	public void validateForPortableImport(JsonNode document) {
		validate(document);
	}

	@Transactional
	public DocumentResponse save(UUID userId, UUID workspaceId, long expectedVersion, JsonNode document) {
		workspaceAccess.requireEditable(userId, workspaceId);
		validate(document);
		var current = documents.findById(workspaceId).orElse(null);
		var actual = current == null ? 0 : current.getVersion();
		if (actual != expectedVersion) throw new ArchitectureDocumentConflictException(actual, current == null ? emptyDocument() : read(current.getDocument()));
		var serialized = write(document);
		var now = Instant.now(clock);
		if (current == null) {
			try { current = documents.saveAndFlush(new ArchitectureDocumentEntity(workspaceId, userId, 1, serialized, now)); }
			catch (DataIntegrityViolationException exception) { var newer = documents.findById(workspaceId).orElseThrow(() -> exception); throw new ArchitectureDocumentConflictException(newer.getVersion(), read(newer.getDocument())); }
			return response(current);
		}
		if (documents.replaceIfVersionMatches(workspaceId, expectedVersion, serialized, now) == 0) {
			var newer = documents.findById(workspaceId).orElseThrow();
			throw new ArchitectureDocumentConflictException(newer.getVersion(), read(newer.getDocument()));
		}
		return new DocumentResponse(workspaceId, actual + 1, document, now);
	}

	@Transactional
	public RevisionResponse createRevision(UUID userId, UUID workspaceId) {
		workspaceAccess.requireEditable(userId, workspaceId);
		var document = documents.findById(workspaceId).orElseThrow(ArchitectureDocumentMissingException::new);
		var revision = revisions.save(new ArchitectureRevisionEntity(workspaceId, userId, document.getVersion(), document.getDocument(), revisionContext(userId, workspaceId), Instant.now(clock)));
		return revisionResponse(revision);
	}

	@Transactional(readOnly = true)
	public RevisionResponse getRevision(UUID userId, UUID workspaceId, UUID revisionId) {
		workspaceAccess.requireOwned(userId, workspaceId);
		return revisions.findByIdAndWorkspaceId(revisionId, workspaceId).map(this::revisionResponse).orElseThrow(ArchitectureRevisionNotFoundException::new);
	}

	private void validate(JsonNode document) {
		if (!document.isObject() || document.path("schemaVersion").asInt(-1) != SCHEMA_VERSION) fail("schemaVersion must be 1");
		var components = requiredArray(document, "components", 250);
		var ids = new HashSet<String>();
		for (var component : components) {
			if (!component.isObject()) fail("components must be objects");
			var id = identifier(component, "id"); if (!ids.add(id)) fail("component ids must be unique");
			boundedText(component, "type", 64); boundedText(component, "label", 120);
			if (!COMPONENT_TYPES.contains(component.path("type").asText()) || !CATEGORIES.contains(component.path("category").asText())) fail("component type or category is unsupported");
			validateMetadata(component.path("metadata")); validateProperties(component.path("category").asText(), component.path("properties"));
		}
		var boundaries = document.path("boundaries");
		if (!boundaries.isMissingNode()) validateBoundaries(boundaries, ids, components);
		var connections = requiredArray(document, "connections", 500);
		var connectionIds = new HashSet<String>();
		for (var connection : connections) {
			if (!connection.isObject()) fail("connections must be objects");
			var id = identifier(connection, "id"); if (!connectionIds.add(id)) fail("connection ids must be unique");
			var from = identifier(connection, "fromComponentId"); var to = identifier(connection, "toComponentId");
			if (!ids.contains(from) || !ids.contains(to) || from.equals(to)) fail("connections require distinct known endpoints");
			if (!CONNECTION_INTENTS.contains(connection.path("intent").asText())) fail("connection intent is unsupported");
			optionalEnum(connection, "protocol", PROTOCOLS); optionalEnum(connection, "guarantee", GUARANTEES); optionalBoundedText(connection, "notes", 1000); validateMetadata(connection.path("metadata"));
		}
	}

	private void validateBoundaries(JsonNode boundaries, Set<String> componentIds, JsonNode components) {
		if (!boundaries.isArray() || boundaries.size() > 100) fail("boundaries is invalid");
		var parents = new java.util.HashMap<String, String>();
		var ids = new HashSet<String>();
		for (var boundary : boundaries) {
			if (!boundary.isObject()) fail("boundaries must be objects"); var id = identifier(boundary, "id"); if (!ids.add(id)) fail("boundary ids must be unique"); boundedText(boundary, "label", 120);
			if (!BOUNDARY_TYPES.contains(boundary.path("type").asText())) fail("boundary type is unsupported");
			var parent = boundary.path("parentBoundaryId"); if (!parent.isMissingNode()) parents.put(id, identifier(boundary, "parentBoundaryId"));
			var members = boundary.path("componentIds"); if (!members.isMissingNode()) { if (!members.isArray() || members.size() > 250) fail("boundary components are invalid"); for (var member : members) if (!componentIds.contains(member.asText())) fail("boundary component is unknown"); }
			validateMetadata(boundary.path("metadata"));
		}
		for (var entry : parents.entrySet()) { var current = entry.getValue(); var visited = new HashSet<String>(); while (current != null) { if (!ids.contains(current) || !visited.add(current) || current.equals(entry.getKey())) fail("boundary nesting is invalid"); current = parents.get(current); } }
		for (var component : components) { var boundaryId = component.path("boundaryId"); if (!boundaryId.isMissingNode() && !ids.contains(boundaryId.asText())) fail("component boundary is unknown"); }
	}

	private JsonNode requiredArray(JsonNode parent, String name, int limit) { var value = parent.get(name); if (value == null || !value.isArray() || value.size() > limit) fail(name + " is required and exceeds its limit"); return value; }
	private String identifier(JsonNode node, String name) { var value = node.path(name).asText(); if (!value.matches("[A-Za-z][A-Za-z0-9_-]{0,63}")) fail(name + " must be a stable identifier"); return value; }
	private void boundedText(JsonNode node, String name, int max) { if (!node.path(name).isTextual() || node.path(name).asText().isBlank() || node.path(name).asText().length() > max) fail(name + " is required and too long"); }
	private void optionalBoundedText(JsonNode node, String name, int max) { if (!node.path(name).isMissingNode() && (!node.path(name).isTextual() || node.path(name).asText().length() > max)) fail(name + " is invalid"); }
	private void optionalEnum(JsonNode node, String name, Set<String> values) { if (!node.path(name).isMissingNode() && (!node.path(name).isTextual() || !values.contains(node.path(name).asText()))) fail(name + " is unsupported"); }
	private void validateProperties(String category, JsonNode value) {
		if (!value.isObject()) fail("properties is required");
		var required = switch (category) { case "COMPUTE" -> "runtime"; case "DATA_STORE" -> "consistency"; case "MESSAGING" -> "deliveryGuarantee"; case "EDGE_SECURITY" -> "exposure"; case "IDENTITY_SECRETS" -> "responsibility"; case "OBSERVABILITY" -> "signal"; case "CUSTOM" -> "semanticIcon"; default -> throw new IllegalStateException("Unknown category"); };
		if (!value.path(required).isTextual()) fail("properties requires " + required);
		var values = switch (category) { case "COMPUTE" -> Set.of("JAVA", "NODE_JS", "PYTHON", "GO", "OTHER"); case "DATA_STORE" -> Set.of("STRONG", "EVENTUAL", "CAUSAL"); case "MESSAGING" -> Set.of("AT_MOST_ONCE", "AT_LEAST_ONCE", "EXACTLY_ONCE"); case "EDGE_SECURITY" -> Set.of("PUBLIC", "PRIVATE", "INTERNAL"); case "IDENTITY_SECRETS" -> Set.of("IDENTITY", "SECRETS"); case "OBSERVABILITY" -> Set.of("LOGS", "METRICS", "TRACES"); case "CUSTOM" -> Set.<String>of(); default -> Set.<String>of(); };
		if (!values.isEmpty() && !values.contains(value.path(required).asText())) fail("properties " + required + " is unsupported"); validateMetadata(value);
	}
	private void validateMetadata(JsonNode value) {
		if (value.isMissingNode() || value.isNull()) return; if (!value.isObject() || value.size() > 20) fail("metadata is invalid");
		for (var entry : value.properties()) { var name = entry.getKey(); if (!name.matches("[A-Za-z][A-Za-z0-9_-]{0,63}") || name.toLowerCase().matches(".*(secret|password|token|credential|api[_-]?key).*$")) fail("metadata must not contain credentials"); var field = entry.getValue(); if (!(field.isTextual() || field.isNumber() || field.isBoolean()) || field.asText().length() > 500) fail("metadata values are invalid"); }
	}
	private void fail(String detail) { throw new InvalidArchitectureDocumentException(detail); }
	private JsonNode emptyDocument() { var document = objectMapper.createObjectNode(); document.put("schemaVersion", SCHEMA_VERSION); document.putArray("components"); document.putArray("connections"); document.putArray("boundaries"); return document; }
	private String revisionContext(UUID userId, UUID workspaceId) {
		try {
			var context = objectMapper.createObjectNode();
			context.set("reasoning", objectMapper.readTree(reasoningSnapshotProvider.snapshotForRevision(userId, workspaceId)));
			context.set("completedScenarios", objectMapper.readTree(scenarioSnapshotProvider.completedSnapshotForRevision(userId, workspaceId)));
			return objectMapper.writeValueAsString(context);
		} catch (Exception exception) { throw new IllegalStateException("Could not snapshot Workspace revision context", exception); }
	}
	private String write(JsonNode value) { try { return objectMapper.writeValueAsString(value); } catch (RuntimeException e) { throw new IllegalStateException("Could not store Architecture Document", e); } }
	private JsonNode read(String value) { try { return objectMapper.readTree(value); } catch (RuntimeException e) { throw new IllegalStateException("Stored Architecture Document is invalid", e); } }
	private DocumentResponse response(ArchitectureDocumentEntity entity) { return new DocumentResponse(entity.getWorkspaceId(), entity.getVersion(), read(entity.getDocument()), entity.getUpdatedAt()); }
	private RevisionResponse revisionResponse(ArchitectureRevisionEntity entity) { return new RevisionResponse(entity.getId(), entity.getWorkspaceId(), entity.getDocumentVersion(), read(entity.getDocument()), read(entity.getReasoningContext()), entity.getCreatedAt()); }

	public record DocumentResponse(UUID workspaceId, long version, JsonNode document, Instant updatedAt) { }
	public record RevisionResponse(UUID id, UUID workspaceId, long documentVersion, JsonNode document, JsonNode reasoningContext, Instant createdAt) { }
	public static class InvalidArchitectureDocumentException extends RuntimeException { public InvalidArchitectureDocumentException(String message) { super(message); } }
	public static class ArchitectureDocumentConflictException extends RuntimeException { private final long currentVersion; private final JsonNode currentDocument; public ArchitectureDocumentConflictException(long currentVersion, JsonNode currentDocument) { super("The Architecture Document changed while you were editing it"); this.currentVersion=currentVersion; this.currentDocument=currentDocument; } public long currentVersion(){return currentVersion;} public JsonNode currentDocument(){return currentDocument;} }
	public static class ArchitectureDocumentMissingException extends RuntimeException { public ArchitectureDocumentMissingException(){super("Add an Architecture Document before preparing a Revision");} }
	public static class ArchitectureRevisionNotFoundException extends RuntimeException { public ArchitectureRevisionNotFoundException(){super("Architecture Revision not found");} }
}
