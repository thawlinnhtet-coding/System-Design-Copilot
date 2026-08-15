package com.example.backend.scenario.api;

import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.scenario.application.ScenarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/scenarios")
@SecurityRequirement(name = "clerkBearerAuth")
public class ScenarioController {
	private final CurrentUserService currentUserService;
	private final ScenarioService scenarios;

	public ScenarioController(CurrentUserService currentUserService, ScenarioService scenarios) { this.currentUserService = currentUserService; this.scenarios = scenarios; }

	@GetMapping
	@Operation(summary = "List private Workspace Scenarios")
	public List<ScenarioService.ScenarioResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId) {
		return scenarios.list(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId);
	}

	@PostMapping("/{scenarioId}/start")
	@Operation(summary = "Reveal an available Scenario")
	public ScenarioService.ScenarioResponse start(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID scenarioId) {
		return scenarios.start(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId, scenarioId);
	}

	@PatchMapping("/{scenarioId}")
	@Operation(summary = "Save a Scenario response draft")
	public ScenarioService.ScenarioResponse saveDraft(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID scenarioId, @Valid @RequestBody ScenarioResponseRequest request) {
		return scenarios.saveDraft(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId, scenarioId, request.toInput());
	}

	@PostMapping("/{scenarioId}/complete")
	@Operation(summary = "Complete a Scenario and include it in later revision context")
	public ScenarioService.ScenarioResponse complete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID scenarioId, @Valid @RequestBody ScenarioResponseRequest request) {
		return scenarios.complete(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId, scenarioId, request.toInput());
	}

	@PostMapping("/ai-assisted")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create a consented, schema-validated AI-assisted Scenario")
	public ScenarioService.ScenarioResponse createAiAssisted(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId) {
		return scenarios.createAiAssisted(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId);
	}

	public record ScenarioResponseRequest(@NotBlank @Size(max = 8000) String response, @Size(max = 4000) String architectureChanges, @Size(max = 4000) String decisionChanges) {
		ScenarioService.ResponseInput toInput() { return new ScenarioService.ResponseInput(response, architectureChanges, decisionChanges); }
	}
}
