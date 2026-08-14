package com.example.backend.architecture.api;

import com.example.backend.architecture.application.PortablePackageService;
import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.workspace.application.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@SecurityRequirement(name = "clerkBearerAuth")
public class PortablePackageController {
	private final CurrentUserService currentUserService;
	private final PortablePackageService service;

	public PortablePackageController(CurrentUserService currentUserService, PortablePackageService service) {
		this.currentUserService = currentUserService;
		this.service = service;
	}

	@PostMapping("/import-packages/validate")
	@Operation(summary = "Validate a portable Import Package without creating a Workspace")
	public PortablePackageService.ImportResponse validateImport(@AuthenticationPrincipal Jwt jwt, @RequestBody @NotNull JsonNode packageNode) {
		return service.validateImport(currentUserService.getOrCreate(jwt.getSubject()).id(), packageNode);
	}

	@PostMapping("/import-packages")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create an Architecture Review Workspace from a validated Import Package")
	public WorkspaceService.WorkspaceSummary importPackage(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody ImportPackageRequest request
	) {
		return service.importPackage(
				currentUserService.getOrCreate(jwt.getSubject()).id(),
				request.name().trim(),
				request.systemDescription().trim(),
				request.reviewGoal().trim(),
				request.packageNode()
		);
	}

	@GetMapping("/workspaces/{workspaceId}/portable-export")
	@Operation(summary = "Export portable content from an owned Workspace")
	public PortablePackageService.ImportResponse export(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId) {
		return service.export(currentUserService.getOrCreate(jwt.getSubject()).id(), workspaceId);
	}

	public record ImportPackageRequest(
			@NotBlank @Size(max = 120) String name,
			@NotBlank @Size(max = 4000) String systemDescription,
			@NotBlank @Size(max = 2000) String reviewGoal,
			@NotNull JsonNode packageNode
	) { }
}
