package com.example.backend.workspace.api;

import com.example.backend.identity.infrastructure.ClerkJwtValidator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.TestPropertySource;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(WorkspaceControllerTests.TestJwtConfiguration.class)
@TestPropertySource(properties = "app.entitlements.free.active-workspaces=1")
class WorkspaceControllerTests {

	private static final String ISSUER = "https://clerk.test";
	private static final String AUDIENCE = "system-design-copilot-api";
	private static final String AUTHORIZED_PARTY = "http://localhost:3000";
	private static final KeyPair SIGNING_KEY = createKeyPair();

	@Autowired
	private MockMvc mockMvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void createsListsRenamesArchivesRestoresAndDeletesAnOwnedWorkspace() throws Exception {
		var token = bearerToken("workspace_lifecycle_" + System.nanoTime());
		var createResponse = mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Checkout platform","description":"Practice the payment flow","type":"CUSTOM_DESIGN","source":"CUSTOM_DESIGN"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.type").value("CUSTOM_DESIGN"))
				.andExpect(jsonPath("$.source").value("CUSTOM_DESIGN"))
				.andExpect(jsonPath("$.status").value("ACTIVE"))
				.andExpect(jsonPath("$.progressPercent").value(0))
				.andExpect(jsonPath("$.saveState").value("NOT_STARTED"))
				.andExpect(jsonPath("$.latestReviewState").value("NOT_REQUESTED"))
				.andReturn();
		var workspaceId = workspaceId(createResponse.getResponse().getContentAsString());

		mockMvc.perform(get("/api/v1/workspaces").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(workspaceId.toString()))
				.andExpect(jsonPath("$[0].name").value("Checkout platform"));

		mockMvc.perform(get("/api/v1/workspaces/{workspaceId}", workspaceId).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(workspaceId.toString()))
				.andExpect(jsonPath("$.description").value("Practice the payment flow"));

		mockMvc.perform(patch("/api/v1/workspaces/{workspaceId}", workspaceId)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Checkout service\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Checkout service"));

		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/archive", workspaceId).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("ARCHIVED"));

		mockMvc.perform(get("/api/v1/me/usage").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.activeWorkspaces.used").value(0));

		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/restore", workspaceId).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("ACTIVE"));

		mockMvc.perform(delete("/api/v1/workspaces/{workspaceId}", workspaceId).header("Authorization", token))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/workspaces").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isEmpty());

		mockMvc.perform(get("/api/v1/me/usage").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.activeWorkspaces.used").value(0));
	}

	@Test
	void createsCustomDesignWorkspaceFromOnlyNameAndSystemIdeaWithBlankArchitectureStart() throws Exception {
		var token = bearerToken("custom_design_entry_" + System.nanoTime());
		var response = mockMvc.perform(post("/api/v1/workspaces/custom-design")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Notification platform\",\"systemIdea\":\"Accept bursty events without losing auditability.\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.type").value("CUSTOM_DESIGN"))
				.andExpect(jsonPath("$.source").value("CUSTOM_DESIGN"))
				.andExpect(jsonPath("$.description").value("Accept bursty events without losing auditability."))
				.andExpect(jsonPath("$.focusStage").value("CLARIFY"))
				.andExpect(jsonPath("$.focusPanel").value("REASONING"))
				.andExpect(jsonPath("$.clarifyPrompt").value("Make the system needs explicit."))
				.andExpect(jsonPath("$.suggestedNextAction").value("Add your first Requirement or open the blank Canvas."))
				.andReturn();
		var workspaceId = workspaceId(response.getResponse().getContentAsString());

		mockMvc.perform(get("/api/v1/workspaces/{workspaceId}/architecture-document", workspaceId)
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.version").value(0))
				.andExpect(jsonPath("$.document.components").isEmpty())
				.andExpect(jsonPath("$.document.connections").isEmpty());
	}

	@Test
	void rejectsCustomDesignCreationWithoutNameOrSystemIdea() throws Exception {
		var token = bearerToken("custom_design_validation_" + System.nanoTime());
		mockMvc.perform(post("/api/v1/workspaces/custom-design")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"\",\"systemIdea\":\"\"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void doesNotRestoreAnArchivedWorkspacePastTheActiveAllowance() throws Exception {
		var token = bearerToken("workspace_restore_quota_" + System.nanoTime());
		var archivedResponse = mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Archived design\",\"description\":\"Restore later\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		var archivedId = workspaceId(archivedResponse.getResponse().getContentAsString());
		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/archive", archivedId).header("Authorization", token))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Active design\",\"description\":\"Uses the allowance\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}"))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/restore", archivedId).header("Authorization", token))
				.andExpect(status().isTooManyRequests())
				.andExpect(jsonPath("$.code").value("allowance_exceeded"));

		mockMvc.perform(get("/api/v1/workspaces").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.id == '%s')].status".formatted(archivedId))
						.value(org.hamcrest.Matchers.contains("ARCHIVED")));
	}

	@Test
	void doesNotExposeAnotherUsersWorkspace() throws Exception {
		var ownerToken = bearerToken("workspace_owner_" + System.nanoTime());
		var otherUserToken = bearerToken("workspace_other_" + System.nanoTime());
		var response = mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", ownerToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Private design\",\"description\":\"Not for another user\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		var workspaceId = workspaceId(response.getResponse().getContentAsString());

		mockMvc.perform(patch("/api/v1/workspaces/{workspaceId}", workspaceId)
				.header("Authorization", otherUserToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Stolen name\"}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("workspace_not_found"));

		mockMvc.perform(get("/api/v1/workspaces").header("Authorization", otherUserToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isEmpty());

		mockMvc.perform(get("/api/v1/workspaces/{workspaceId}", workspaceId).header("Authorization", otherUserToken))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("workspace_not_found"));
	}

	@Test
	void rejectsInvalidCustomWorkspaceInput() throws Exception {
		mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", bearerToken("workspace_validation_" + System.nanoTime()))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\" \",\"description\":\" \"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void createsEveryFixedWorkspaceTypeWithItsProvenanceSource() throws Exception {
		var custom = createWorkspace("Custom", "CUSTOM_DESIGN", "CUSTOM_DESIGN");
		var imported = createWorkspace("Imported review", "ARCHITECTURE_REVIEW", "IMPORT_PACKAGE");
		var manual = createWorkspace("Manual review", "ARCHITECTURE_REVIEW", "MANUAL_RECREATION");

		assertWorkspaceMetadata(custom, "CUSTOM_DESIGN", "CUSTOM_DESIGN");
		assertWorkspaceMetadata(imported, "ARCHITECTURE_REVIEW", "IMPORT_PACKAGE");
		assertWorkspaceMetadata(manual, "ARCHITECTURE_REVIEW", "MANUAL_RECREATION");
	}

	@Test
	void rejectsWorkspaceTypeAndSourceCombinationsThatCannotBeResumedSafely() throws Exception {
		mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", bearerToken("workspace_type_validation_" + System.nanoTime()))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Invalid\",\"description\":\"Invalid entry\",\"type\":\"CHALLENGE\",\"source\":\"IMPORT_PACKAGE\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("invalid_workspace_type_source"));
	}

	@Test
	void rejectsDirectChallengeWorkspaceCreationWithoutAVersionSnapshot() throws Exception {
		var token = bearerToken("workspace_challenge_attempts_" + System.nanoTime());
		mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"URL shortener\",\"description\":\"Direct attempt\",\"type\":\"CHALLENGE\",\"source\":\"CURATED_CHALLENGE\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("invalid_workspace_type_source"));
	}

	@Test
	void createsEditsListsAndDeletesOwnedWorkspaceReasoning() throws Exception {
		var token = bearerToken("workspace_reasoning_" + System.nanoTime());
		var workspaceResponse = mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"News feed\",\"description\":\"Practice the feed trade-offs\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.reviewBriefRequired").value(false))
				.andReturn();
		var workspaceId = workspaceId(workspaceResponse.getResponse().getContentAsString());

		var requirementResponse = mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/reasoning/requirements", workspaceId)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"kind":"FUNCTIONAL","statement":"Publish a feed item","priority":"MUST","status":"OPEN","measurableTarget":"p99 under 200 ms"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.statement").value("Publish a feed item"))
				.andExpect(jsonPath("$.orderIndex").value(0))
				.andReturn();
		var requirementId = workspaceId(requirementResponse.getResponse().getContentAsString());

		var assumptionResponse = mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/reasoning/assumptions", workspaceId)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"category":"Traffic","quantitativeValue":"1000000","unit":"daily readers","rationale":"Initial beta estimate","confidence":"MEDIUM","status":"ACTIVE"}
						"""))
				.andExpect(status().isCreated())
				.andReturn();
		var assumptionId = workspaceId(assumptionResponse.getResponse().getContentAsString());

		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/reasoning/questions", workspaceId)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"question":"How fresh must the feed be?","whyItMatters":"It changes cache invalidation","status":"OPEN","relatedRequirementIds":["%s"],"relatedAssumptionIds":["%s"]}
						""".formatted(requirementId, assumptionId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.relatedRequirementIds[0]").value(requirementId.toString()));

		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/reasoning/decisions", workspaceId)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"title":"Use a fan-out feed model","chosenOption":"Fan out on write","rationale":"Reads stay simple","status":"PROPOSED","evidenceRefs":["REQ-001"]}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.evidenceRefs[0]").value("REQ-001"));

		mockMvc.perform(put("/api/v1/workspaces/{workspaceId}/reasoning/review-brief", workspaceId)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"systemDescription\":\"A personalized news feed\",\"reviewGoal\":\"Check freshness and scale trade-offs\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reviewGoal").value("Check freshness and scale trade-offs"));

		mockMvc.perform(patch("/api/v1/workspaces/{workspaceId}/reasoning/requirements/{id}", workspaceId, requirementId)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"kind":"FUNCTIONAL","statement":"Publish feed items durably","priority":"MUST","status":"SATISFIED","orderIndex":2}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.statement").value("Publish feed items durably"))
				.andExpect(jsonPath("$.orderIndex").value(2));

		mockMvc.perform(get("/api/v1/workspaces/{workspaceId}/reasoning", workspaceId).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.requirements[0].statement").value("Publish feed items durably"))
				.andExpect(jsonPath("$.assumptions[0].category").value("Traffic"))
				.andExpect(jsonPath("$.questions[0].question").value("How fresh must the feed be?"))
				.andExpect(jsonPath("$.decisions[0].title").value("Use a fan-out feed model"))
				.andExpect(jsonPath("$.reviewBrief.systemDescription").value("A personalized news feed"));

		mockMvc.perform(delete("/api/v1/workspaces/{workspaceId}/reasoning/assumptions/{id}", workspaceId, assumptionId)
				.header("Authorization", token))
				.andExpect(status().isNoContent());

		mockMvc.perform(delete("/api/v1/workspaces/{workspaceId}", workspaceId)
				.header("Authorization", token))
				.andExpect(status().isNoContent());
		mockMvc.perform(get("/api/v1/workspaces/{workspaceId}/reasoning", workspaceId).header("Authorization", token))
				.andExpect(status().isNotFound());
	}

	@Test
	void doesNotExposeReasoningFromAnotherWorkspaceOwner() throws Exception {
		var ownerToken = bearerToken("reasoning_owner_" + System.nanoTime());
		var otherToken = bearerToken("reasoning_other_" + System.nanoTime());
		var response = mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", ownerToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Private reasoning\",\"description\":\"Do not leak this\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		var workspaceId = workspaceId(response.getResponse().getContentAsString());

		mockMvc.perform(get("/api/v1/workspaces/{workspaceId}/reasoning", workspaceId).header("Authorization", otherToken))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("workspace_not_found"));
	}

	@Test
	void keepsArchivedReasoningReadableButRejectsEdits() throws Exception {
		var token = bearerToken("reasoning_archived_" + System.nanoTime());
		var response = mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Archived reasoning\",\"description\":\"Read-only context\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		var workspaceId = workspaceId(response.getResponse().getContentAsString());
		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/archive", workspaceId).header("Authorization", token))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/workspaces/{workspaceId}/reasoning", workspaceId).header("Authorization", token))
				.andExpect(status().isOk());
		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/reasoning/requirements", workspaceId)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"kind\":\"FUNCTIONAL\",\"statement\":\"Read-only test\",\"priority\":\"MUST\",\"status\":\"OPEN\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("workspace_archived"));
	}

	@Test
	void savesValidatedArchitectureDocumentsDetectsStaleSavesAndCreatesImmutableRevisions() throws Exception {
		var token = bearerToken("architecture_document_" + System.nanoTime());
		var created = mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Orders\",\"description\":\"Document contract\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}"))
				.andExpect(status().isCreated()).andReturn();
		var id = workspaceId(created.getResponse().getContentAsString());
		var document = """
				{"schemaVersion":1,"components":[{"id":"api","type":"SERVICE","label":"Orders API","category":"COMPUTE","properties":{"runtime":"JAVA"}}],"connections":[]}
				""";

		mockMvc.perform(put("/api/v1/workspaces/{workspaceId}/architecture-document", id)
				.header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
				.content("{\"expectedVersion\":0,\"document\":" + document + "}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1))
				.andExpect(jsonPath("$.document.components[0].id").value("api"));

		mockMvc.perform(put("/api/v1/workspaces/{workspaceId}/architecture-document", id)
				.header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
				.content("{\"expectedVersion\":0,\"document\":" + document + "}"))
				.andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("architecture_document_conflict"))
				.andExpect(jsonPath("$.currentVersion").value(1));

		var revision = mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/architecture-revisions", id)
				.header("Authorization", token))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.documentVersion").value(1)).andReturn();
		var revisionId = objectMapper.readTree(revision.getResponse().getContentAsString()).path("id").asText();
		mockMvc.perform(get("/api/v1/workspaces/{workspaceId}/architecture-revisions/{revisionId}", id, revisionId)
				.header("Authorization", token)).andExpect(status().isOk())
				.andExpect(jsonPath("$.document.components[0].label").value("Orders API"));
	}

	@Test
	void rejectsArchitectureDocumentsWithUnsupportedSchemasCredentialsOrInvalidConnections() throws Exception {
		var token = bearerToken("architecture_validation_" + System.nanoTime());
		var response = mockMvc.perform(post("/api/v1/workspaces").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Validation\",\"description\":\"Keep documents safe\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}")).andReturn();
		var id = workspaceId(response.getResponse().getContentAsString());
		var invalid = """
				{"schemaVersion":2,"components":[{"id":"api","type":"SERVICE","label":"API","category":"COMPUTE","properties":{"secret":"never"}}],"connections":[{"id":"self","fromComponentId":"api","toComponentId":"api","intent":"REQUEST_RESPONSE"}]}
				""";
		mockMvc.perform(put("/api/v1/workspaces/{workspaceId}/architecture-document", id).header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"expectedVersion\":0,\"document\":" + invalid + "}"))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid_architecture_document"));
	}

	@Test
	void protectsArchitectureDocumentsByOwnershipAndWorkspaceLifecycle() throws Exception {
		var owner = bearerToken("architecture_owner_" + System.nanoTime());
		var other = bearerToken("architecture_other_" + System.nanoTime());
		var created = mockMvc.perform(post("/api/v1/workspaces").header("Authorization", owner).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Private\",\"description\":\"Protected document\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}")).andReturn();
		var id = workspaceId(created.getResponse().getContentAsString());
		var document = "{\"schemaVersion\":1,\"components\":[{\"id\":\"api\",\"type\":\"SERVICE\",\"label\":\"API\",\"category\":\"COMPUTE\",\"properties\":{\"runtime\":\"JAVA\"}}],\"connections\":[]}";
		mockMvc.perform(put("/api/v1/workspaces/{workspaceId}/architecture-document", id).header("Authorization", other).contentType(MediaType.APPLICATION_JSON)
				.content("{\"expectedVersion\":0,\"document\":" + document + "}")).andExpect(status().isNotFound());
		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/archive", id).header("Authorization", owner)).andExpect(status().isOk());
		mockMvc.perform(put("/api/v1/workspaces/{workspaceId}/architecture-document", id).header("Authorization", owner).contentType(MediaType.APPLICATION_JSON)
				.content("{\"expectedVersion\":0,\"document\":" + document + "}")).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("workspace_archived"));
	}

	@Test
	void acceptsCustomComponentsAndNestedBoundaries() throws Exception {
		var token = bearerToken("architecture_boundaries_" + System.nanoTime());
		var created = mockMvc.perform(post("/api/v1/workspaces").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Boundaries\",\"description\":\"Custom components\",\"type\":\"CUSTOM_DESIGN\",\"source\":\"CUSTOM_DESIGN\"}")).andReturn();
		var id = workspaceId(created.getResponse().getContentAsString());
		var document = """
				{"schemaVersion":1,"components":[{"id":"vendor","type":"CUSTOM_COMPONENT","label":"Fraud Provider","category":"CUSTOM","properties":{"semanticIcon":"service","provider":"Acme"}}],"connections":[],"boundaries":[{"id":"region","label":"Primary region","type":"REGION","componentIds":["vendor"]},{"id":"trust","label":"Trusted network","type":"TRUST","parentBoundaryId":"region","componentIds":[]}]}
				""";
		mockMvc.perform(put("/api/v1/workspaces/{workspaceId}/architecture-document", id).header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"expectedVersion\":0,\"document\":" + document + "}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.document.components[0].type").value("CUSTOM_COMPONENT"))
				.andExpect(jsonPath("$.document.boundaries[1].parentBoundaryId").value("region"));
	}

	private UUID workspaceId(String response) throws Exception {
		JsonNode root = objectMapper.readTree(response);
		return UUID.fromString(root.path("id").asText());
	}

	private String createWorkspace(String name, String type, String source) throws Exception {
		var response = mockMvc.perform(post("/api/v1/workspaces")
				.header("Authorization", bearerToken("workspace_types_" + name + "_" + System.nanoTime()))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"%s\",\"description\":\"Workspace entry\",\"type\":\"%s\",\"source\":\"%s\"}".formatted(name, type, source)))
				.andExpect(status().isCreated())
				.andReturn();
		return response.getResponse().getContentAsString();
	}

	private void assertWorkspaceMetadata(String response, String type, String source) throws Exception {
		var root = objectMapper.readTree(response);
		org.assertj.core.api.Assertions.assertThat(root.path("type").asText()).isEqualTo(type);
		org.assertj.core.api.Assertions.assertThat(root.path("source").asText()).isEqualTo(source);
	}

	private static String bearerToken(String subject) throws Exception {
		var claims = new JWTClaimsSet.Builder()
				.subject(subject)
				.issuer(ISSUER)
				.audience(AUDIENCE)
				.claim("azp", AUTHORIZED_PARTY)
				.issueTime(Date.from(Instant.now()))
				.expirationTime(Date.from(Instant.now().plusSeconds(300)))
				.build();
		var token = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
		token.sign(new RSASSASigner(SIGNING_KEY.getPrivate()));
		return "Bearer " + token.serialize();
	}

	private static KeyPair createKeyPair() {
		try {
			var generator = KeyPairGenerator.getInstance("RSA");
			generator.initialize(2048);
			return generator.generateKeyPair();
		} catch (Exception exception) {
			throw new IllegalStateException("Unable to generate test signing key", exception);
		}
	}

	@TestConfiguration
	static class TestJwtConfiguration {
		@Bean
		@Primary
		JwtDecoder testJwtDecoder() {
			var decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) SIGNING_KEY.getPublic()).build();
			decoder.setJwtValidator(ClerkJwtValidator.create(ISSUER, AUDIENCE, AUTHORIZED_PARTY));
			return decoder;
		}
	}
}
