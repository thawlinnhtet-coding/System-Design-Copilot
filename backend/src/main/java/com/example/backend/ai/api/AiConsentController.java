package com.example.backend.ai.api;

import com.example.backend.ai.application.AiConsent;
import com.example.backend.ai.application.AiConsentPolicy;
import com.example.backend.ai.application.AiConsentService;
import com.example.backend.identity.application.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/me/ai-consent")
@SecurityRequirement(name = "clerkBearerAuth")
public class AiConsentController {

	private final CurrentUserService currentUserService;
	private final AiConsentService consentService;

	public AiConsentController(CurrentUserService currentUserService, AiConsentService consentService) {
		this.currentUserService = currentUserService;
		this.consentService = consentService;
	}

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Read the current AI Processing Consent and bounded context policy")
	public AiConsentResponse get(@AuthenticationPrincipal Jwt jwt) {
		var userId = currentUserService.getOrCreate(jwt.getSubject()).id();
		return response(consentService.current(userId));
	}

	@PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Grant AI Processing Consent for the presented policy version")
	public AiConsentResponse grant(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody GrantConsentRequest request
	) {
		var userId = currentUserService.getOrCreate(jwt.getSubject()).id();
		return response(consentService.grant(userId, request.policyVersion().trim()));
	}

	@DeleteMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Withdraw AI Processing Consent")
	public AiConsentResponse withdraw(@AuthenticationPrincipal Jwt jwt) {
		var userId = currentUserService.getOrCreate(jwt.getSubject()).id();
		return response(consentService.withdraw(userId));
	}

	private AiConsentResponse response(AiConsent consent) {
		var policy = consentService.policy();
		return new AiConsentResponse(
				consent.granted(),
				consent.policyVersion(),
				consent.changedAt(),
				new PolicyResponse(
						policy.version(),
						AiConsentPolicy.INCLUDED_CATEGORIES,
						AiConsentPolicy.EXCLUDED_CATEGORIES,
						"OpenRouter routes only to providers marked data_collection=deny with provider fallback disabled.",
						true,
						"Context already sent to a provider cannot be retracted."
				)
		);
	}

	public record GrantConsentRequest(@NotBlank @Size(max = 64) String policyVersion) {
	}

	public record AiConsentResponse(
			boolean granted,
			String policyVersion,
			Instant changedAt,
			PolicyResponse policy
	) {
	}

	public record PolicyResponse(
			String currentVersion,
			List<String> includedCategories,
			List<String> excludedCategories,
			String providerRouting,
			boolean revocable,
			String priorTransmissionNotice
	) {
	}
}
