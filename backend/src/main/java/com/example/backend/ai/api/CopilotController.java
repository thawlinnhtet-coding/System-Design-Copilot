package com.example.backend.ai.api;

import com.example.backend.ai.application.CopilotService;
import com.example.backend.identity.application.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/copilot")
@SecurityRequirement(name = "clerkBearerAuth")
public class CopilotController {
	private final CurrentUserService users;
	private final CopilotService copilot;
	public CopilotController(CurrentUserService users, CopilotService copilot) { this.users = users; this.copilot = copilot; }

	@PostMapping(value = "/turns", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Get advisory contextual Copilot guidance for one owned Workspace")
	public CopilotService.CopilotTurn turn(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @Valid @RequestBody CopilotTurnRequest request) {
		return copilot.answer(users.getOrCreate(jwt.getSubject()).id(), workspaceId, request.clientTurnId(), request.question().trim());
	}

	public record CopilotTurnRequest(@NotNull UUID clientTurnId, @NotBlank @Size(max = 4_000) String question) { }
}
