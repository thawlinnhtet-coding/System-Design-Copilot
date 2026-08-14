package com.example.backend.challenge.api;

import com.example.backend.challenge.application.ChallengeService;
import com.example.backend.identity.application.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/challenges")
public class ChallengeController {
	private final ChallengeService challengeService;
	private final CurrentUserService currentUserService;
	public ChallengeController(ChallengeService challengeService, CurrentUserService currentUserService) { this.challengeService = challengeService; this.currentUserService = currentUserService; }
	@GetMapping
	@Operation(summary = "List published Challenge catalog metadata")
	public List<ChallengeService.ChallengeSummary> catalog() { return challengeService.catalog(); }
	@GetMapping("/{slug}")
	@SecurityRequirement(name = "clerkBearerAuth")
	@Operation(summary = "Get the entitled published Challenge Version detail")
	public ChallengeService.ChallengeDetail detail(@AuthenticationPrincipal Jwt jwt, @PathVariable String slug) {
		return challengeService.detail(currentUserService.getOrCreate(jwt.getSubject()).id(), slug);
	}
	@PostMapping("/{slug}/workspaces")
	@ResponseStatus(HttpStatus.CREATED)
	@SecurityRequirement(name = "clerkBearerAuth")
	@Operation(summary = "Start an independent private Workspace from a published Challenge Version")
	public com.example.backend.workspace.application.WorkspaceService.WorkspaceSummary start(@AuthenticationPrincipal Jwt jwt, @PathVariable String slug) {
		return challengeService.start(currentUserService.getOrCreate(jwt.getSubject()).id(), slug);
	}
}
