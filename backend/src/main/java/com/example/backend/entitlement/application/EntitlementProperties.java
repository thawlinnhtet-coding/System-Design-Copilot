package com.example.backend.entitlement.application;

import jakarta.validation.constraints.Positive;
import jakarta.validation.Valid;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.entitlements")
public record EntitlementProperties(@Valid Free free) {

	public record Free(
			@Positive int activeWorkspaces,
			@Positive int copilotTurnsPerMonth,
			@Positive int reviewsPerMonth
	) {
	}

}
