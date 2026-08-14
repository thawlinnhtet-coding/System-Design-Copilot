package com.example.backend.ai.application;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.net.URI;
import java.time.Duration;

@Validated
@ConfigurationProperties("app.ai")
public record AiProviderProperties(
		String openRouterBaseUrl,
		String openRouterApiKey,
		String copilotModel,
		String reviewModel,
		Duration requestTimeout,
		int maxOutputTokens,
		BigDecimal dailyBudgetUsd,
		String consentPolicyVersion
) {

	public AiProviderProperties {
		if (openRouterBaseUrl == null || openRouterBaseUrl.isBlank() || !validHttpUri(openRouterBaseUrl)) {
			throw new IllegalArgumentException("AI OpenRouter base URL must be an absolute HTTP(S) URL");
		}
		if (openRouterApiKey == null || openRouterApiKey.isBlank()) {
			throw new IllegalArgumentException("AI OpenRouter API key must not be blank");
		}
		if (copilotModel == null || copilotModel.isBlank() || reviewModel == null || reviewModel.isBlank()) {
			throw new IllegalArgumentException("AI Copilot and Review models must not be blank");
		}
		if (requestTimeout == null || requestTimeout.isZero() || requestTimeout.isNegative()
				|| requestTimeout.compareTo(Duration.ofMinutes(2)) > 0) {
			throw new IllegalArgumentException("AI request timeout must be between one millisecond and two minutes");
		}
		if (maxOutputTokens <= 0 || maxOutputTokens > 32_000) {
			throw new IllegalArgumentException("AI max output tokens must be between 1 and 32000");
		}
		if (dailyBudgetUsd == null || dailyBudgetUsd.signum() <= 0
				|| dailyBudgetUsd.compareTo(new BigDecimal("0.10")) > 0) {
			throw new IllegalArgumentException("AI daily budget must be positive and no more than USD 0.10");
		}
		if (consentPolicyVersion == null || consentPolicyVersion.isBlank()) {
			throw new IllegalArgumentException("AI consent policy version must not be blank");
		}
	}

	public AiModelProfile profile(AiProfile profile) {
		return new AiModelProfile(profile, profile == AiProfile.COPILOT ? copilotModel : reviewModel, maxOutputTokens);
	}

	private static boolean validHttpUri(String value) {
		try {
			var uri = URI.create(value);
			return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
					&& uri.getHost() != null;
		} catch (IllegalArgumentException exception) {
			return false;
		}
	}
}
