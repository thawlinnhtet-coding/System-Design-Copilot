package com.example.backend.workspace.api;

import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.workspace.application.WorkspaceService;
import com.example.backend.workspace.infrastructure.WorkspaceSource;
import com.example.backend.workspace.infrastructure.WorkspaceType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/v1/workspaces")
@SecurityRequirement(name = "clerkBearerAuth")
public class WorkspaceController {

	private final CurrentUserService currentUserService;
	private final WorkspaceService workspaceService;

	public WorkspaceController(CurrentUserService currentUserService, WorkspaceService workspaceService) {
		this.currentUserService = currentUserService;
		this.workspaceService = workspaceService;
	}

	@GetMapping
	@Operation(summary = "List owned Workspaces")
	public List<WorkspaceService.WorkspaceSummary> list(@AuthenticationPrincipal Jwt jwt) {
		return workspaceService.list(currentUserService.getOrCreate(jwt.getSubject()).id());
	}

	@GetMapping("/{workspaceId}")
	@Operation(summary = "Get an owned Workspace")
	public WorkspaceService.WorkspaceSummary get(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID workspaceId
	) {
		return workspaceService.get(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create a custom Workspace")
	public WorkspaceService.WorkspaceSummary create(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CreateWorkspaceRequest request
	) {
		return workspaceService.create(
				currentUserService.getOrCreate(jwt.getSubject()).id(),
				request.name().trim(),
				request.description().trim(),
				request.type(),
				request.source()
		);
	}

	@PostMapping("/custom-design")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create a blank Custom Design Workspace")
	public WorkspaceService.WorkspaceSummary createCustomDesign(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CreateCustomDesignWorkspaceRequest request
	) {
		return workspaceService.createCustomDesign(
				currentUserService.getOrCreate(jwt.getSubject()).id(),
				request.name().trim(),
				request.systemIdea().trim()
		);
	}

	@PatchMapping("/{workspaceId}/focus")
	@Operation(summary = "Save Workspace focus and Canvas viewport")
	public WorkspaceService.WorkspaceSummary updateFocus(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID workspaceId,
			@Valid @RequestBody WorkspaceFocusRequest request
	) {
		return workspaceService.updateFocus(
				currentUserService.getOrCreate(jwt.getSubject()).id(),
				workspaceId,
				request.stage(),
				request.panel(),
				request.canvasViewport()
		);
	}

	@PatchMapping("/{workspaceId}")
	@Operation(summary = "Rename an owned Workspace")
	public WorkspaceService.WorkspaceSummary rename(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID workspaceId,
			@Valid @RequestBody RenameWorkspaceRequest request
	) {
		return workspaceService.rename(
				currentUserService.getOrCreate(jwt.getSubject()).id(),
				workspaceId,
				request.name().trim()
		);
	}

	@PostMapping("/{workspaceId}/archive")
	@Operation(summary = "Archive an owned Workspace")
	public WorkspaceService.WorkspaceSummary archive(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID workspaceId
	) {
		return workspaceService.archive(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId);
	}

	@PostMapping("/{workspaceId}/restore")
	@Operation(summary = "Restore an owned Workspace")
	public WorkspaceService.WorkspaceSummary restore(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID workspaceId
	) {
		return workspaceService.restore(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId);
	}

	@DeleteMapping("/{workspaceId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Permanently delete an owned Workspace")
	public void delete(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID workspaceId,
			@Valid @RequestBody DeleteWorkspaceRequest request
	) {
		workspaceService.delete(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId, request.confirmationName());
	}

	public record CreateWorkspaceRequest(
			@NotBlank @Size(max = 120) String name,
			@NotBlank @Size(max = 2000) String description,
			@jakarta.validation.constraints.NotNull WorkspaceType type,
			@jakarta.validation.constraints.NotNull WorkspaceSource source
	) {
	}

	public record CreateCustomDesignWorkspaceRequest(
			@NotBlank @Size(max = 120) String name,
			@NotBlank @Size(max = 2000) String systemIdea
	) {
	}

	public record WorkspaceFocusRequest(
			@NotBlank String stage,
			@NotBlank String panel,
			@jakarta.validation.constraints.NotNull JsonNode canvasViewport
	) {
	}

	public record RenameWorkspaceRequest(@NotBlank @Size(max = 120) String name) {
	}

	public record DeleteWorkspaceRequest(@NotBlank @Size(max = 120) String confirmationName) {
	}
}
