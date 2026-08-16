package com.example.backend.identity.application;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.account-deletion")
public record AccountDeletionProperties(
		@Min(1) int recentAuthenticationMinutes,
		@NotBlank String cancellationBaseUrl,
		String clerkSecretKey,
		String clerkApiBaseUrl,
		String resendApiKey,
		String resendFromEmail
) { }
