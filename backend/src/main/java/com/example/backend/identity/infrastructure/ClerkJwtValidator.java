package com.example.backend.identity.infrastructure;

import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;

import java.util.Collection;

public final class ClerkJwtValidator {

	private ClerkJwtValidator() {
	}

	public static OAuth2TokenValidator<Jwt> create(String issuer, String audience, String authorizedParty) {
		var issuerValidator = JwtValidators.createDefaultWithIssuer(issuer);
		var audienceValidator = new JwtClaimValidator<Collection<String>>("aud", audiences -> audiences != null && audiences.contains(audience));
		var authorizedPartyValidator = new JwtClaimValidator<String>("azp", authorizedParty::equals);
		var subjectValidator = new JwtClaimValidator<String>("sub", subject -> subject != null && !subject.isBlank());
		return new DelegatingOAuth2TokenValidator<>(issuerValidator, audienceValidator, authorizedPartyValidator, subjectValidator);
	}

}
