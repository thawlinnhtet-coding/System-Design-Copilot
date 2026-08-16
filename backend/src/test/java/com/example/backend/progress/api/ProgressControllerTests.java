package com.example.backend.progress.api;

import com.example.backend.ai.application.AiProviderPort;
import com.example.backend.ai.application.AiProviderResponse;
import com.example.backend.identity.infrastructure.ClerkJwtValidator;
import com.example.backend.review.application.ReviewService;
import com.example.backend.review.infrastructure.ReviewJobRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;

@SpringBootTest
@AutoConfigureMockMvc
@Import(ProgressControllerTests.TestConfiguration.class)
class ProgressControllerTests {
	private static final String ISSUER = "https://clerk.test", AUDIENCE = "system-design-copilot-api", AZP = "http://localhost:3000";
	private static final KeyPair KEY = key();
	@Autowired private MockMvc mvc;
	@Autowired private ReviewService reviews;
	@Autowired private ReviewJobRepository jobs;
	private final ObjectMapper json = new ObjectMapper();

	@Test
	void returnsOnlyOwnedActivityAndComparesSharedDimensionsWithinOneWorkspace() throws Exception {
		var owner = token("progress_owner_" + System.nanoTime());
		var other = token("progress_other_" + System.nanoTime());
		var workspace = workspace(owner, "Owned booking design");
		document(owner, workspace, 0, "Booking API");
		consent(owner);
		completeReview(owner, workspace, "first-review");
		document(owner, workspace, 1, "Booking API v2");
		completeReview(owner, workspace, "second-review");
		workspace(other, "Other user's private workspace");

		mvc.perform(get("/api/v1/me/progress").header("Authorization", owner))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.practiceVolume.ownedWorkspaceCount").value(1))
				.andExpect(jsonPath("$.practiceVolume.completedReviewCount").value(2))
				.andExpect(content().string(not(containsString("Other user's private workspace"))))
				.andExpect(jsonPath("$.qualifiedReviewTrends[?(@.workspaceId == '" + workspace + "' && @.dimension == 'reliabilityAndFailureHandling' && @.change == 2)]").exists());
	}

	private UUID workspace(String token, String name) throws Exception {
		var response = mvc.perform(post("/api/v1/workspaces/custom-design").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + name + "\",\"systemIdea\":\"Keep inventory durable.\"}"))
				.andExpect(status().isCreated()).andReturn();
		return UUID.fromString(json.readTree(response.getResponse().getContentAsString()).path("id").asText());
	}

	private void document(String token, UUID workspaceId, int version, String label) throws Exception {
		var document = "{\"schemaVersion\":1,\"components\":[{\"id\":\"api\",\"type\":\"SERVICE\",\"label\":\"" + label + "\",\"category\":\"COMPUTE\",\"properties\":{\"runtime\":\"JAVA\"}}],\"connections\":[]}";
		mvc.perform(put("/api/v1/workspaces/{id}/architecture-document", workspaceId).header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content("{\"expectedVersion\":" + version + ",\"document\":" + document + "}"))
				.andExpect(status().isOk());
	}

	private void consent(String token) throws Exception {
		mvc.perform(put("/api/v1/me/ai-consent").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content("{\"policyVersion\":\"2026-08-01\"}")).andExpect(status().isOk());
	}

	private void completeReview(String token, UUID workspaceId, String key) throws Exception {
		var response = mvc.perform(post("/api/v1/workspaces/{id}/reviews", workspaceId).header("Authorization", token).header("Idempotency-Key", key)).andExpect(status().isAccepted()).andReturn();
		var requestId = UUID.fromString(json.readTree(response.getResponse().getContentAsString()).path("id").asText());
		var job = jobs.findByReviewRequestId(requestId).orElseThrow();
		reviews.process(job.getId(), key);
	}

	private static String token(String subject) throws Exception {
		var claims = new JWTClaimsSet.Builder().subject(subject).issuer(ISSUER).audience(AUDIENCE).claim("azp", AZP).claim("email_verified", true).issueTime(Date.from(Instant.now())).expirationTime(Date.from(Instant.now().plusSeconds(300))).build();
		var value = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims); value.sign(new RSASSASigner(KEY.getPrivate())); return "Bearer " + value.serialize();
	}
	private static KeyPair key() { try { var generator = KeyPairGenerator.getInstance("RSA"); generator.initialize(2048); return generator.generateKeyPair(); } catch (Exception exception) { throw new IllegalStateException(exception); } }

	@org.springframework.boot.test.context.TestConfiguration
	static class TestConfiguration {
		@Bean @Primary JwtDecoder decoder() { var value = NimbusJwtDecoder.withPublicKey((RSAPublicKey) KEY.getPublic()).build(); value.setJwtValidator(ClerkJwtValidator.create(ISSUER, AUDIENCE, AZP)); return value; }
		@Bean @Primary AiProviderPort provider() { return request -> new AiProviderResponse(request.untrustedContext().contains("Booking API v2") ? "{\"overallScore\":4,\"summary\":\"Clear design.\",\"uncertainty\":0.2,\"scores\":{\"reliabilityAndFailureHandling\":4,\"scalingAndPerformance\":3},\"findings\":[]}" : "{\"overallScore\":2,\"summary\":\"Early design.\",\"uncertainty\":0.2,\"scores\":{\"reliabilityAndFailureHandling\":2,\"scalingAndPerformance\":3},\"findings\":[]}", "success", "progress-test"); }
	}
}
