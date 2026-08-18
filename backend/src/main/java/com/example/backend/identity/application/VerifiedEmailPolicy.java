package com.example.backend.identity.application;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/** Requires Clerk's signed email-verification claim for sensitive product actions. */
@Component
public class VerifiedEmailPolicy {

	public void requireVerified(Jwt jwt) {
		if (!isVerified(jwt)) {
			throw new EmailVerificationRequiredException();
		}
	}

	public boolean isVerified(Jwt jwt) {
		var value = jwt.getClaim("email_verified");
		return Boolean.TRUE.equals(value) || "true".equalsIgnoreCase(String.valueOf(value)) || "verified".equalsIgnoreCase(String.valueOf(value));
	}

	public String verifiedEmail(Jwt jwt) {
		requireVerified(jwt);
		var email = jwt.getClaimAsString("email");
		if (email == null || email.isBlank() || email.length() > 320 || !email.contains("@")) throw new EmailVerificationRequiredException();
		return email;
	}
}
