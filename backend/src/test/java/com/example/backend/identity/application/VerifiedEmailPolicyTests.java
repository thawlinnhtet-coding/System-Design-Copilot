package com.example.backend.identity.application;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VerifiedEmailPolicyTests {
	private final VerifiedEmailPolicy policy = new VerifiedEmailPolicy();

	@Test
	void acceptsClerkVerifiedEmailClaim() {
		assertThatCode(() -> policy.requireVerified(jwt(true))).doesNotThrowAnyException();
	}

	@Test
	void rejectsMissingOrUnverifiedEmailClaims() {
		assertThatThrownBy(() -> policy.requireVerified(jwt(false))).isInstanceOf(EmailVerificationRequiredException.class);
		assertThatThrownBy(() -> policy.requireVerified(jwt(null))).isInstanceOf(EmailVerificationRequiredException.class);
	}

	private Jwt jwt(Boolean emailVerified) {
		var builder = Jwt.withTokenValue("test").header("alg", "RS256").subject("user_1").issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60));
		if (emailVerified != null) builder.claim("email_verified", emailVerified);
		return builder.build();
	}
}
