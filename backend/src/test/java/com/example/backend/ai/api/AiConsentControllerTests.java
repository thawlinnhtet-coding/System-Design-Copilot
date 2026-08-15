package com.example.backend.ai.api;

import com.example.backend.identity.infrastructure.ClerkJwtValidator;
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

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(AiConsentControllerTests.TestJwtConfiguration.class)
class AiConsentControllerTests {

	private static final String ISSUER = "https://clerk.test";
	private static final String AUDIENCE = "system-design-copilot-api";
	private static final String AUTHORIZED_PARTY = "http://localhost:3000";
	private static final String POLICY_VERSION = "2026-08-01";
	private static final KeyPair SIGNING_KEY = createKeyPair();

	@Autowired
	private MockMvc mockMvc;

	@Test
	void requiresVerifiedEmailBeforeGrantingAiConsent() throws Exception {
		var token = bearerToken("consent_unverified_" + System.nanoTime(), false);

		mockMvc.perform(put("/api/v1/me/ai-consent")
					.header("Authorization", token)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"policyVersion\":\"" + POLICY_VERSION + "\"}"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("email_verification_required"));
	}

	@Test
	void exposesBoundedPolicyAndPersistsGrantForTheAuthenticatedUser() throws Exception {
		var token = bearerToken("consent_grant_" + System.nanoTime());

		mockMvc.perform(get("/api/v1/me/ai-consent").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.granted").value(false))
				.andExpect(jsonPath("$.policy.currentVersion").value(POLICY_VERSION))
				.andExpect(jsonPath("$.policy.includedCategories").isArray())
				.andExpect(jsonPath("$.policy.excludedCategories").value(org.hamcrest.Matchers.hasItem("Credentials, tokens, passwords, and authentication metadata")))
				.andExpect(jsonPath("$.policy.providerRouting").value(org.hamcrest.Matchers.containsString("data_collection=deny")));

		mockMvc.perform(put("/api/v1/me/ai-consent")
					.header("Authorization", token)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"policyVersion\":\"" + POLICY_VERSION + "\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.granted").value(true))
				.andExpect(jsonPath("$.changedAt").exists());

		mockMvc.perform(get("/api/v1/me/ai-consent").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.granted").value(true));
	}

	@Test
	void withdrawalIsVisibleAndThePolicyExplainsThatPriorTransmissionCannotBeRetracted() throws Exception {
		var token = bearerToken("consent_withdraw_" + System.nanoTime());
		grant(token);

		mockMvc.perform(delete("/api/v1/me/ai-consent").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.granted").value(false))
				.andExpect(jsonPath("$.policy.revocable").value(true))
				.andExpect(jsonPath("$.policy.priorTransmissionNotice").value("Context already sent to a provider cannot be retracted."));
	}

	@Test
	void rejectsAnOldConsentPolicyVersionWithoutGrantingConsent() throws Exception {
		var token = bearerToken("consent_invalid_" + System.nanoTime());

		mockMvc.perform(put("/api/v1/me/ai-consent")
					.header("Authorization", token)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"policyVersion\":\"2025-01-01\"}"))
				.andExpect(status().isUnprocessableEntity())
				.andExpect(jsonPath("$.code").value("ai_consent_policy_unsupported"));

		mockMvc.perform(get("/api/v1/me/ai-consent").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.granted").value(false));
	}

	@Test
	void rejectsUnauthenticatedConsentAccess() throws Exception {
		mockMvc.perform(get("/api/v1/me/ai-consent"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void publishesTheConsentContract() throws Exception {
		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.paths['/api/v1/me/ai-consent'].get").exists())
				.andExpect(jsonPath("$.paths['/api/v1/me/ai-consent'].put").exists())
				.andExpect(jsonPath("$.paths['/api/v1/me/ai-consent'].delete").exists());
	}

	@Test
	void publishesTheContextualCopilotContract() throws Exception {
		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.paths['/api/v1/workspaces/{workspaceId}/copilot/turns'].post").exists());
	}

	private void grant(String token) throws Exception {
		mockMvc.perform(put("/api/v1/me/ai-consent")
					.header("Authorization", token)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"policyVersion\":\"" + POLICY_VERSION + "\"}"))
				.andExpect(status().isOk());
	}

	private static String bearerToken(String subject) throws Exception {
		return bearerToken(subject, true);
	}

	private static String bearerToken(String subject, boolean emailVerified) throws Exception {
		var claims = new JWTClaimsSet.Builder()
				.subject(subject)
				.issuer(ISSUER)
				.audience(AUDIENCE)
				.claim("azp", AUTHORIZED_PARTY)
				.claim("email_verified", emailVerified)
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
