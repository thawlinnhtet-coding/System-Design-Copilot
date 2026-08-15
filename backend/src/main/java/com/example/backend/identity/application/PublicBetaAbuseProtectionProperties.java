package com.example.backend.identity.application;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.public-beta.abuse-protection")
public record PublicBetaAbuseProtectionProperties(
		@Min(1) int originRequestsPerMinute,
		@Min(1) int userRequestsPerMinute,
		@Min(1) int unverifiedChallengeThreshold,
		@Min(1) int concurrentRequestsPerUser
) {
}
