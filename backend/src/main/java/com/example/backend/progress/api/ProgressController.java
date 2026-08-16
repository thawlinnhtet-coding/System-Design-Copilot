package com.example.backend.progress.api;

import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.progress.application.ProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/progress")
@SecurityRequirement(name = "clerkBearerAuth")
public class ProgressController {
	private final CurrentUserService users;
	private final ProgressService progress;

	public ProgressController(CurrentUserService users, ProgressService progress) {
		this.users = users;
		this.progress = progress;
	}

	@GetMapping
	@Operation(summary = "Get private practice progress and qualified Workspace-scoped Review trends")
	public ProgressService.ProgressOverview overview(@AuthenticationPrincipal Jwt jwt) {
		return progress.overview(users.getOrCreate(jwt.getSubject()).id());
	}
}
