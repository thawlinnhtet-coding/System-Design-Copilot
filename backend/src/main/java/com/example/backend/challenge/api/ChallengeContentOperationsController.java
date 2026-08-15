package com.example.backend.challenge.api;

import com.example.backend.challenge.application.ChallengeContentOperationsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/content-operations/challenge-versions")
@SecurityRequirement(name = "clerkBearerAuth")
public class ChallengeContentOperationsController {
	private final ChallengeContentOperationsService service;

	public ChallengeContentOperationsController(ChallengeContentOperationsService service) { this.service = service; }

	@PostMapping("/{versionId}/submit-review")
	@Operation(summary = "Move a Draft Challenge Version into independent Review")
	public ChallengeContentOperationsService.ReleaseResult submitForReview(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID versionId) {
		return service.submitForReview(jwt.getSubject(), versionId);
	}

	@PostMapping("/{versionId}/publish")
	@Operation(summary = "Publish an independently reviewed Challenge Version")
	public ChallengeContentOperationsService.ReleaseResult publish(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID versionId) {
		return service.publish(jwt.getSubject(), versionId);
	}

	@PostMapping("/{versionId}/retire")
	@Operation(summary = "Retire a published Challenge Version")
	public ChallengeContentOperationsService.ReleaseResult retire(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID versionId) {
		return service.retire(jwt.getSubject(), versionId);
	}
}
