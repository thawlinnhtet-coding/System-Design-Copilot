package com.example.backend.identity.application;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.account-deletion")
public record AccountDeletionProperties(
		String clerkSecretKey,
		String clerkApiBaseUrl
) { }
