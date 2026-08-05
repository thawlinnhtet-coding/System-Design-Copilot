package com.example.backend.identity.api;

import com.example.backend.identity.infrastructure.ClerkJwtValidator;
import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.entitlement.application.EntitlementService;
import com.example.backend.entitlement.application.QuotaExceededException;
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
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(CurrentUserControllerTests.TestJwtConfiguration.class)
class CurrentUserControllerTests {

	private static final String ISSUER = "https://clerk.test";
	private static final String AUDIENCE = "system-design-copilot-api";
	private static final String AUTHORIZED_PARTY = "http://localhost:3000";
	private static final KeyPair SIGNING_KEY = createKeyPair();

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private CurrentUserService currentUserService;

	@Autowired
	private EntitlementService entitlementService;

	@Test
	void createsAndReturnsTheCurrentUserFromAVerifiedClerkSubject() throws Exception {
		mockMvc.perform(get("/api/v1/me").header("Authorization", bearerToken("user_123", ISSUER, AUDIENCE, AUTHORIZED_PARTY, SIGNING_KEY, Instant.now().plusSeconds(300))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.clerkSubject").value("user_123"));
	}

	@Test
	void doesNotAllowAUserToSelectAnotherUsersIdentity() throws Exception {
		mockMvc.perform(get("/api/v1/me?userId=user_456").header("Authorization", bearerToken("user_123", ISSUER, AUDIENCE, AUTHORIZED_PARTY, SIGNING_KEY, Instant.now().plusSeconds(300))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.clerkSubject").value("user_123"));
	}

	@Test
	void rejectsMissingTokens() throws Exception {
		mockMvc.perform(get("/api/v1/me"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsTokensWithAnInvalidIssuer() throws Exception {
		mockMvc.perform(get("/api/v1/me").header("Authorization", bearerToken("user_123", "https://other-clerk.test", AUDIENCE, AUTHORIZED_PARTY, SIGNING_KEY, Instant.now().plusSeconds(300))))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsTokensWithAnInvalidAudience() throws Exception {
		mockMvc.perform(get("/api/v1/me").header("Authorization", bearerToken("user_123", ISSUER, "other-api", AUTHORIZED_PARTY, SIGNING_KEY, Instant.now().plusSeconds(300))))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsTokensWithAnInvalidAuthorizedParty() throws Exception {
		mockMvc.perform(get("/api/v1/me").header("Authorization", bearerToken("user_123", ISSUER, AUDIENCE, "https://other-app.test", SIGNING_KEY, Instant.now().plusSeconds(300))))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsTokensWithoutASubject() throws Exception {
		mockMvc.perform(get("/api/v1/me").header("Authorization", bearerToken("", ISSUER, AUDIENCE, AUTHORIZED_PARTY, SIGNING_KEY, Instant.now().plusSeconds(300))))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsExpiredTokens() throws Exception {
		mockMvc.perform(get("/api/v1/me").header("Authorization", bearerToken("user_123", ISSUER, AUDIENCE, AUTHORIZED_PARTY, SIGNING_KEY, Instant.now().minusSeconds(1))))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsTokensWithAnInvalidSignature() throws Exception {
		mockMvc.perform(get("/api/v1/me").header("Authorization", bearerToken("user_123", ISSUER, AUDIENCE, AUTHORIZED_PARTY, createKeyPair(), Instant.now().plusSeconds(300))))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void publishesTheCurrentUserContractWithBearerAuthentication() throws Exception {
		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.paths['/api/v1/me'].get.security[0].clerkBearerAuth").isArray())
				.andExpect(jsonPath("$.components.securitySchemes.clerkBearerAuth.scheme").value("bearer"));
	}

	@Test
	void showsTheFreePlanAndCurrentUsageToTheAuthenticatedUser() throws Exception {
		var clerkSubject = "plan_" + System.nanoTime();

		mockMvc.perform(get("/api/v1/me/usage").header("Authorization", bearerToken(clerkSubject, ISSUER, AUDIENCE, AUTHORIZED_PARTY, SIGNING_KEY, Instant.now().plusSeconds(300))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.plan").value("FREE"))
				.andExpect(jsonPath("$.activeWorkspaces.used").value(0))
				.andExpect(jsonPath("$.activeWorkspaces.limit").value(10))
				.andExpect(jsonPath("$.copilotTurns.used").value(0))
				.andExpect(jsonPath("$.copilotTurns.limit").value(50))
				.andExpect(jsonPath("$.reviews.used").value(0))
				.andExpect(jsonPath("$.reviews.limit").value(5))
				.andExpect(jsonPath("$.renewsAt").exists());
	}

	@Test
	void reportsDurablyRecordedAiUsage() throws Exception {
		var clerkSubject = "usage_" + System.nanoTime();
		var user = currentUserService.getOrCreate(clerkSubject);
		entitlementService.recordAcceptedCopilotTurn(user.id(), UUID.randomUUID());
		entitlementService.recordAcceptedCopilotTurn(user.id(), UUID.randomUUID());
		entitlementService.recordCompletedReview(user.id(), UUID.randomUUID());

		mockMvc.perform(get("/api/v1/me/usage").header("Authorization", bearerToken(clerkSubject, ISSUER, AUDIENCE, AUTHORIZED_PARTY, SIGNING_KEY, Instant.now().plusSeconds(300))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.copilotTurns.used").value(2))
				.andExpect(jsonPath("$.reviews.used").value(1));
	}

	@Test
	void recordsEachAcceptedCopilotTurnOnlyOnce() {
		var user = currentUserService.getOrCreate("idempotent_" + System.nanoTime());
		var copilotTurnId = UUID.randomUUID();

		entitlementService.recordAcceptedCopilotTurn(user.id(), copilotTurnId);
		entitlementService.recordAcceptedCopilotTurn(user.id(), copilotTurnId);

		assertEquals(1, entitlementService.currentEntitlements(user.id()).copilotTurns().used());
	}

	@Test
	void enforcesTheActiveWorkspaceAllowance() {
		var user = currentUserService.getOrCreate("workspaces_" + System.nanoTime());

		for (var index = 0; index < 10; index++) {
			entitlementService.registerActiveWorkspace(user.id());
		}

		assertThrows(QuotaExceededException.class, () -> entitlementService.registerActiveWorkspace(user.id()));
		entitlementService.unregisterActiveWorkspace(user.id());
		entitlementService.registerActiveWorkspace(user.id());
	}

	@Test
	void concurrentCopilotUsageCannotExceedTheAllowance() throws Exception {
		var clerkSubject = "concurrent_" + System.nanoTime();
		var user = currentUserService.getOrCreate(clerkSubject);
		var executor = Executors.newFixedThreadPool(12);
		try {
			var tasks = new ArrayList<java.util.concurrent.Callable<Boolean>>();
			for (var index = 0; index < 60; index++) {
				tasks.add(() -> {
					try {
						entitlementService.recordAcceptedCopilotTurn(user.id(), UUID.randomUUID());
						return true;
					} catch (QuotaExceededException exception) {
						return false;
					}
				});
			}

			var successes = 0;
			for (var result : executor.invokeAll(tasks)) {
				if (result.get()) {
					successes++;
				}
			}

			assertEquals(50, successes);
			assertEquals(50, entitlementService.currentEntitlements(user.id()).copilotTurns().used());
		} finally {
			executor.shutdownNow();
		}
	}

	@Test
	void concurrentWorkspaceCreationCannotExceedTheAllowance() throws Exception {
		var user = currentUserService.getOrCreate("concurrent_workspaces_" + System.nanoTime());
		var executor = Executors.newFixedThreadPool(12);
		try {
			var tasks = new ArrayList<java.util.concurrent.Callable<Boolean>>();
			for (var index = 0; index < 20; index++) {
				tasks.add(() -> {
					try {
						entitlementService.registerActiveWorkspace(user.id());
						return true;
					} catch (QuotaExceededException exception) {
						return false;
					}
				});
			}

			var successes = 0;
			for (var result : executor.invokeAll(tasks)) {
				if (result.get()) {
					successes++;
				}
			}

			assertEquals(10, successes);
			assertEquals(10, entitlementService.currentEntitlements(user.id()).activeWorkspaces().used());
		} finally {
			executor.shutdownNow();
		}
	}

	private static String bearerToken(String subject, String issuer, String audience, String authorizedParty, KeyPair signingKey, Instant expiresAt) throws Exception {
		var claims = new JWTClaimsSet.Builder()
				.subject(subject)
				.issuer(issuer)
				.audience(audience)
				.claim("azp", authorizedParty)
				.issueTime(Date.from(Instant.now()))
				.expirationTime(Date.from(expiresAt))
				.build();
		var token = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
		token.sign(new RSASSASigner(signingKey.getPrivate()));
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
