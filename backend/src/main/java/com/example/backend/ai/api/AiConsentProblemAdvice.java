package com.example.backend.ai.api;

import com.example.backend.ai.application.AiConsentExceptions.AiConsentRequiredException;
import com.example.backend.ai.application.AiConsentExceptions.UnsupportedConsentPolicyException;
import com.example.backend.ai.application.AiProviderExceptions.DailyBudgetExceededException;
import com.example.backend.ai.application.AiProviderExceptions.NoEligibleProviderException;
import com.example.backend.ai.application.AiProviderExceptions.UnavailableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class AiConsentProblemAdvice {

	@ExceptionHandler(AiConsentRequiredException.class)
	ProblemDetail consentRequired(AiConsentRequiredException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.PRECONDITION_REQUIRED, exception.getMessage());
		problem.setTitle("AI Processing Consent required");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/ai-consent-required"));
		problem.setProperty("code", "ai_consent_required");
		return problem;
	}

	@ExceptionHandler(UnsupportedConsentPolicyException.class)
	ProblemDetail unsupportedPolicy(UnsupportedConsentPolicyException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, exception.getMessage());
		problem.setTitle("Unsupported AI consent policy");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/ai-consent-policy-unsupported"));
		problem.setProperty("code", "ai_consent_policy_unsupported");
		return problem;
	}

	@ExceptionHandler(DailyBudgetExceededException.class)
	ProblemDetail budgetExceeded(DailyBudgetExceededException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, exception.getMessage());
		problem.setTitle("AI daily budget reached");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/ai-daily-budget-reached"));
		problem.setProperty("code", "ai_daily_budget_reached");
		return problem;
	}

	@ExceptionHandler(UnavailableException.class)
	ProblemDetail providerUnavailable(UnavailableException exception) {
		if (exception instanceof NoEligibleProviderException) {
			var problem = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
			problem.setTitle("No eligible AI provider available");
			problem.setType(URI.create("https://system-design-copilot.dev/problems/ai-no-eligible-provider"));
			problem.setProperty("code", "ai_no_eligible_provider");
			return problem;
		}
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
		problem.setTitle("AI provider unavailable");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/ai-provider-unavailable"));
		problem.setProperty("code", "ai_provider_unavailable");
		return problem;
	}
}
