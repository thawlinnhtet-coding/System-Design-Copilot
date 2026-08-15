package com.example.backend.architecture.api;

import com.example.backend.architecture.application.ArchitectureReviewEntryService;
import com.example.backend.architecture.application.ArchitectureReviewEntryExceptions.InvalidIdempotencyKeyException;
import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.workspace.application.WorkspaceService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/architecture-review-workspaces")
@SecurityRequirement(name = "clerkBearerAuth")
public class ArchitectureReviewEntryController {

	private final CurrentUserService currentUserService;
	private final ArchitectureReviewEntryService service;

	public ArchitectureReviewEntryController(CurrentUserService currentUserService, ArchitectureReviewEntryService service) {
		this.currentUserService = currentUserService;
		this.service = service;
	}

	@PostMapping("/manual-recreation")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create a Manual Recreation Architecture Review Workspace")
	public WorkspaceService.WorkspaceSummary createManualRecreation(
			@AuthenticationPrincipal Jwt jwt,
			@Parameter(in = ParameterIn.HEADER, required = true, description = "Caller-generated idempotency key")
			@RequestHeader("Idempotency-Key") String idempotencyKey,
			@Valid @RequestBody ManualRecreationRequest request
	) {
		if (idempotencyKey.isBlank() || idempotencyKey.length() > 255) {
			throw new InvalidIdempotencyKeyException();
		}
		return service.createManualRecreation(
				currentUserService.getOrCreate(jwt.getSubject()).id(),
				idempotencyKey,
				new ArchitectureReviewEntryService.ManualRecreationInput(
					request.name(), request.systemDescription(), request.reviewGoal(), request.knownRequirements(), request.knownAssumptions())
		);
	}

	public record ManualRecreationRequest(
			@NotBlank @Size(max = 120) String name,
			@NotBlank @Size(max = 2000) String systemDescription,
			@NotBlank @Size(max = 2000) String reviewGoal,
			@Size(max = 50) List<@NotBlank @Size(max = 2000) String> knownRequirements,
			@Size(max = 50) List<@NotBlank @Size(max = 2000) String> knownAssumptions
	) {
	}
}
