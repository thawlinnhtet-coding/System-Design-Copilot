package com.example.backend.challenge.api;

import com.example.backend.identity.infrastructure.ClerkJwtValidator;
import com.example.backend.workspace.infrastructure.WorkspaceRepository;
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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(ChallengeControllerTests.TestJwtConfiguration.class)
@TestPropertySource(properties = "app.entitlements.free.active-workspaces=3")
class ChallengeControllerTests {
	private static final String ISSUER = "https://clerk.test";
	private static final String AUDIENCE = "system-design-copilot-api";
	private static final String AUTHORIZED_PARTY = "http://localhost:3000";
	private static final KeyPair SIGNING_KEY = createKeyPair();

	@Autowired MockMvc mockMvc;
	@Autowired WorkspaceRepository workspaceRepository;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void exposesOnlySafeMetadataToPublicVisitors() throws Exception {
		mockMvc.perform(get("/api/v1/challenges"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(6)))
				.andExpect(jsonPath("$[0].title").exists())
				.andExpect(jsonPath("$[0].topic").exists())
				.andExpect(jsonPath("$[0].difficulty").exists())
				.andExpect(jsonPath("$[0].estimatedMinutes").exists())
				.andExpect(jsonPath("$[0].problemStatement").doesNotExist())
				.andExpect(jsonPath("$[0].topicPacks").doesNotExist());
	}

	@Test
	void protectsPromptDetailsAndStartsIndependentVersionedWorkspaces() throws Exception {
		var token = bearerToken("challenge_user_" + System.nanoTime());
		mockMvc.perform(get("/api/v1/challenges/url-shortener").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.problemStatement").isNotEmpty())
				.andExpect(jsonPath("$.initialConstraints").isArray())
				.andExpect(jsonPath("$.skillCoverage[0].level").value("introduce"))
				.andExpect(jsonPath("$.scenarioPreview").isArray())
				.andExpect(jsonPath("$.topicPacks[0]").value("request paths"));

		var first = mockMvc.perform(post("/api/v1/challenges/url-shortener/workspaces").header("Authorization", token))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.type").value("CHALLENGE"))
				.andExpect(jsonPath("$.source").value("CURATED_CHALLENGE"))
				.andExpect(jsonPath("$.challengeVersionId").isNotEmpty())
				.andReturn();
		var second = mockMvc.perform(post("/api/v1/challenges/url-shortener/workspaces").header("Authorization", token))
				.andExpect(status().isCreated())
				.andReturn();

		var firstId = workspaceId(first.getResponse().getContentAsString());
		var secondId = workspaceId(second.getResponse().getContentAsString());
		org.assertj.core.api.Assertions.assertThat(secondId).isNotEqualTo(firstId);
		org.assertj.core.api.Assertions.assertThat(workspaceRepository.findById(firstId).orElseThrow().getChallengeSnapshot())
				.contains("problemStatement", "initialConstraints", "skillCoverage", "scenarioPreview");
		mockMvc.perform(get("/api/v1/challenges/url-shortener").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.attempts", org.hamcrest.Matchers.hasSize(2)));
	}

	@Test
	void rejectsChallengeDetailsAndStartsForVisitors() throws Exception {
		mockMvc.perform(get("/api/v1/challenges/url-shortener")).andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/v1/challenges/url-shortener/workspaces")).andExpect(status().isUnauthorized());
	}

	@Test
	void returnsStableNotFoundProblemForUnknownOrRetiredDiscovery() throws Exception {
		mockMvc.perform(get("/api/v1/challenges/does-not-exist").header("Authorization", bearerToken("challenge_missing_" + System.nanoTime())))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("challenge_not_found"));
	}

	private UUID workspaceId(String response) throws Exception {
		JsonNode root = objectMapper.readTree(response);
		return UUID.fromString(root.path("id").asText());
	}

	private static String bearerToken(String subject) throws Exception {
		var claims = new JWTClaimsSet.Builder().subject(subject).issuer(ISSUER).audience(AUDIENCE).claim("azp", AUTHORIZED_PARTY)
				.issueTime(Date.from(Instant.now())).expirationTime(Date.from(Instant.now().plusSeconds(300))).build();
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
