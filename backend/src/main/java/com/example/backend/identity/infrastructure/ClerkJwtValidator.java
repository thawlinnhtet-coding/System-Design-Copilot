package com.example.backend.identity.infrastructure;

import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;

import java.util.Collection;
import java.time.Duration;

public final class ClerkJwtValidator {

	private ClerkJwtValidator() {
	}

	public static OAuth2TokenValidator<Jwt> create(String issuer, String audience, String authorizedParty) {
		return create(issuer, audience, authorizedParty, Duration.ofMinutes(10));
	}

	public static OAuth2TokenValidator<Jwt> create(String issuer, String audience, String authorizedParty, Duration maxLifetime) {
		var issuerValidator = JwtValidators.createDefaultWithIssuer(issuer);
		var audienceValidator = new JwtClaimValidator<Collection<String>>("aud", audiences -> audiences != null && audiences.contains(audience));
		var authorizedPartyValidator = new JwtClaimValidator<String>("azp", authorizedParty::equals);
		var subjectValidator = new JwtClaimValidator<String>("sub", subject -> subject != null && !subject.isBlank());
		var tokenLifetimeValidator = (OAuth2TokenValidator<Jwt>) jwt -> {
			if (jwt.getIssuedAt() == null || jwt.getExpiresAt() == null || Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt()).compareTo(maxLifetime) > 0) {
				return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(new org.springframework.security.oauth2.core.OAuth2Error("token_lifetime_too_long"));
			}
			return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success();
		};
		return new DelegatingOAuth2TokenValidator<>(issuerValidator, audienceValidator, authorizedPartyValidator, subjectValidator, tokenLifetimeValidator);
	}

}
