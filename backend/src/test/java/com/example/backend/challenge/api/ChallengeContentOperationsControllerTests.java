package com.example.backend.challenge.api;

import com.example.backend.identity.infrastructure.ClerkJwtValidator;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(ChallengeContentOperationsControllerTests.TestJwtConfiguration.class)
@TestPropertySource(properties = "app.content-operations.authorized-clerk-subjects=challenge_operator")
class ChallengeContentOperationsControllerTests {
	private static final String VERSION_ID = "11111111-1111-4111-8111-111111111112";
	private static final String ISSUER = "https://clerk.test";
	private static final String AUDIENCE = "system-design-copilot-api";
	private static final String AUTHORIZED_PARTY = "http://localhost:3000";
	private static final KeyPair SIGNING_KEY = keyPair();

	@Autowired MockMvc mockMvc;
	@Autowired JdbcTemplate jdbcTemplate;

	@BeforeEach
	void resetVersion() {
		jdbcTemplate.update("UPDATE challenge_versions SET status = 'DRAFT', published_at = NULL WHERE id = ?", java.util.UUID.fromString(VERSION_ID));
		jdbcTemplate.update("UPDATE challenges SET status = 'DRAFT' WHERE id = ?", java.util.UUID.fromString("11111111-1111-4111-8111-111111111111"));
	}

	@AfterEach
	void restoreSeededPublication() {
		jdbcTemplate.update("UPDATE challenge_versions SET status = 'PUBLISHED' WHERE id = ?", java.util.UUID.fromString(VERSION_ID));
		jdbcTemplate.update("UPDATE challenges SET status = 'PUBLISHED' WHERE id = ?", java.util.UUID.fromString("11111111-1111-4111-8111-111111111111"));
	}

	@Test
	void authorizedOperatorCanReleaseDraftReviewPublishedAndRetiredVersions() throws Exception {
		mockMvc.perform(post("/api/v1/content-operations/challenge-versions/{versionId}/submit-review", VERSION_ID).header("Authorization", token("challenge_operator")))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REVIEW"));
		mockMvc.perform(post("/api/v1/content-operations/challenge-versions/{versionId}/publish", VERSION_ID).header("Authorization", token("challenge_operator")))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"));
		mockMvc.perform(post("/api/v1/content-operations/challenge-versions/{versionId}/retire", VERSION_ID).header("Authorization", token("challenge_operator")))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RETIRED"));
	}

	@Test
	void rejectsUnauthorisedOperatorsAndInvalidTransitions() throws Exception {
		mockMvc.perform(post("/api/v1/content-operations/challenge-versions/{versionId}/submit-review", VERSION_ID).header("Authorization", token("not_an_operator")))
				.andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("challenge_content_operator_forbidden"));
		mockMvc.perform(post("/api/v1/content-operations/challenge-versions/{versionId}/publish", VERSION_ID).header("Authorization", token("challenge_operator")))
				.andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("invalid_challenge_content_lifecycle"));
	}

	private static String token(String subject) throws Exception {
		var claims = new JWTClaimsSet.Builder().subject(subject).issuer(ISSUER).audience(AUDIENCE).claim("azp", AUTHORIZED_PARTY).issueTime(Date.from(Instant.now())).expirationTime(Date.from(Instant.now().plusSeconds(300))).build();
		var token = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
		token.sign(new RSASSASigner(SIGNING_KEY.getPrivate()));
		return "Bearer " + token.serialize();
	}

	private static KeyPair keyPair() {
		try { var generator = KeyPairGenerator.getInstance("RSA"); generator.initialize(2048); return generator.generateKeyPair(); }
		catch (Exception exception) { throw new IllegalStateException(exception); }
	}

	@TestConfiguration
	static class TestJwtConfiguration {
		@Bean @Primary JwtDecoder testJwtDecoder() {
			var decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) SIGNING_KEY.getPublic()).build();
			decoder.setJwtValidator(ClerkJwtValidator.create(ISSUER, AUDIENCE, AUTHORIZED_PARTY));
			return decoder;
		}
	}
}
