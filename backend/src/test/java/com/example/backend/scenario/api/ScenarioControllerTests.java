package com.example.backend.scenario.api;

import com.example.backend.ai.application.AiProviderPort;
import com.example.backend.ai.application.AiProviderRequest;
import com.example.backend.ai.application.AiProviderResponse;
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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(ScenarioControllerTests.TestConfiguration.class)
class ScenarioControllerTests {
	private static final String ISSUER = "https://clerk.test";
	private static final String AUDIENCE = "system-design-copilot-api";
	private static final String AUTHORIZED_PARTY = "http://localhost:3000";
	private static final KeyPair SIGNING_KEY = createKeyPair();
	@Autowired private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void seedsProgressivePrivateCuratedScenariosAndIncludesCompletedContextInARevision() throws Exception {
		var token = bearerToken("scenario_arc_" + System.nanoTime());
		var started = mockMvc.perform(post("/api/v1/challenges/url-shortener/workspaces").header("Authorization", token))
				.andExpect(status().isCreated()).andReturn();
		var workspaceId = id(started.getResponse().getContentAsString());
		var scenarios = mockMvc.perform(get("/api/v1/workspaces/{workspaceId}/scenarios", workspaceId).header("Authorization", token))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].title").value("Viral redirect traffic"))
				.andExpect(jsonPath("$[1].title").value("Persistence region failure")).andReturn();
		var firstId = objectMapper.readTree(scenarios.getResponse().getContentAsString()).get(0).path("id").asText();
		var secondId = objectMapper.readTree(scenarios.getResponse().getContentAsString()).get(1).path("id").asText();

		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/scenarios/{scenarioId}/start", workspaceId, secondId).header("Authorization", token))
				.andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("scenario_unavailable"));
		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/scenarios/{scenarioId}/start", workspaceId, firstId).header("Authorization", token))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REVEALED"));
		var response = """
				{"response":"Separate hot redirect reads from durable link writes and apply targeted rate limits.","architectureChanges":"Add a cache and admission control.","decisionChanges":"Document cache invalidation trade-offs."}
				""";
		mockMvc.perform(patch("/api/v1/workspaces/{workspaceId}/scenarios/{scenarioId}", workspaceId, firstId).header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(response))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT"));
		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/scenarios/{scenarioId}/complete", workspaceId, firstId).header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(response))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMPLETED"));

		var document = "{\"schemaVersion\":1,\"components\":[{\"id\":\"api\",\"type\":\"SERVICE\",\"label\":\"Redirect API\",\"category\":\"COMPUTE\",\"properties\":{\"runtime\":\"JAVA\"}}],\"connections\":[]}";
		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/workspaces/{workspaceId}/architecture-document", workspaceId).header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content("{\"expectedVersion\":0,\"document\":" + document + "}"))
				.andExpect(status().isOk());
		var revision = mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/architecture-revisions", workspaceId).header("Authorization", token)).andExpect(status().isCreated()).andReturn();
		var revisionId = objectMapper.readTree(revision.getResponse().getContentAsString()).path("id").asText();
		mockMvc.perform(get("/api/v1/workspaces/{workspaceId}/architecture-revisions/{revisionId}", workspaceId, revisionId).header("Authorization", token))
				.andExpect(status().isOk()).andExpect(jsonPath("$.reasoningContext.completedScenarios[0].title").value("Viral redirect traffic"));
	}

	@Test
	void requiresConsentBeforeCreatingAiAssistedScenario() throws Exception {
		var token = bearerToken("scenario_ai_" + System.nanoTime());
		var created = mockMvc.perform(post("/api/v1/workspaces/custom-design").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Alerts\",\"systemIdea\":\"Deliver urgent alerts reliably\"}"))
				.andExpect(status().isCreated()).andReturn();
		var workspaceId = id(created.getResponse().getContentAsString());
		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/scenarios/ai-assisted", workspaceId).header("Authorization", token))
				.andExpect(status().isPreconditionRequired()).andExpect(jsonPath("$.code").value("ai_consent_required"));
		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/me/ai-consent").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content("{\"policyVersion\":\"2026-08-01\"}"))
				.andExpect(status().isOk());
		mockMvc.perform(post("/api/v1/workspaces/{workspaceId}/scenarios/ai-assisted", workspaceId).header("Authorization", token))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.source").value("AI_ASSISTED")).andExpect(jsonPath("$.status").value("AVAILABLE"));
	}

	private UUID id(String body) throws Exception { JsonNode root = objectMapper.readTree(body); return UUID.fromString(root.path("id").asText()); }
	private static String bearerToken(String subject) throws Exception { var claims = new JWTClaimsSet.Builder().subject(subject).issuer(ISSUER).audience(AUDIENCE).claim("azp", AUTHORIZED_PARTY).issueTime(Date.from(Instant.now())).expirationTime(Date.from(Instant.now().plusSeconds(300))).build(); var token = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims); token.sign(new RSASSASigner(SIGNING_KEY.getPrivate())); return "Bearer " + token.serialize(); }
	private static KeyPair createKeyPair() { try { var generator = KeyPairGenerator.getInstance("RSA"); generator.initialize(2048); return generator.generateKeyPair(); } catch (Exception exception) { throw new IllegalStateException(exception); } }

	@org.springframework.boot.test.context.TestConfiguration
	static class TestConfiguration {
		@Bean @Primary JwtDecoder testJwtDecoder() { var decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) SIGNING_KEY.getPublic()).build(); decoder.setJwtValidator(ClerkJwtValidator.create(ISSUER, AUDIENCE, AUTHORIZED_PARTY)); return decoder; }
		@Bean @Primary AiProviderPort testAiProvider() { return (AiProviderRequest ignored) -> new AiProviderResponse("{\"title\":\"Provider quota squeeze\",\"changedCondition\":\"Delivery provider capacity is reduced.\",\"details\":\"What changes while alerts remain urgent?\",\"category\":\"OPERATIONS\"}", "scenario-test", "copilot-test"); }
	}
}
