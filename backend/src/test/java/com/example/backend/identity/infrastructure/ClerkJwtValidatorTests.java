package com.example.backend.identity.infrastructure;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ClerkJwtValidatorTests {
	private static final String ISSUER = "https://clerk.test";
	private static final String AUDIENCE = "system-design-copilot-api";
	private static final String AUTHORIZED_PARTY = "http://localhost:3000";

	@Test
	void rejectsApiTokensWhoseLifetimeExceedsTenMinutes() {
		var now = Instant.now();
		var jwt = Jwt.withTokenValue("test")
				.header("alg", "RS256")
				.issuer(ISSUER)
				.subject("user_1")
				.audience(List.of(AUDIENCE))
				.claim("azp", AUTHORIZED_PARTY)
				.issuedAt(now)
				.expiresAt(now.plusSeconds(601))
				.build();

		assertThat(ClerkJwtValidator.create(ISSUER, AUDIENCE, AUTHORIZED_PARTY).validate(jwt).hasErrors()).isTrue();
	}
}
