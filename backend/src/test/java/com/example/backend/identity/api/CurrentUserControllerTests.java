package com.example.backend.identity.api;

import com.example.backend.identity.infrastructure.ClerkJwtValidator;
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
