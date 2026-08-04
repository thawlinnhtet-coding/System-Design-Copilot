package com.example.backend.identity.infrastructure;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@ConfigurationProperties("app.security")
public record ClerkSecurityProperties(
		Clerk clerk,
		Cors cors
) {

	public record Clerk(
			@NotBlank String issuer,
			@NotBlank String audience,
			@NotBlank String authorizedParty,
			@NotBlank String jwkSetUri
	) {
	}

	public record Cors(List<@NotBlank String> allowedOrigins) {
	}

}
