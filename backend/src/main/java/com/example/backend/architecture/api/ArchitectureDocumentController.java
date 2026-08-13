package com.example.backend.architecture.api;

import com.example.backend.architecture.application.ArchitectureDocumentService;
import com.example.backend.identity.application.CurrentUserService;
import tools.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}")
@SecurityRequirement(name = "clerkBearerAuth")
public class ArchitectureDocumentController {
	private final CurrentUserService currentUserService;
	private final ArchitectureDocumentService service;
	public ArchitectureDocumentController(CurrentUserService currentUserService, ArchitectureDocumentService service) { this.currentUserService=currentUserService; this.service=service; }
	@GetMapping("/architecture-document") @Operation(summary = "Get an owned Architecture Document")
	public ArchitectureDocumentService.DocumentResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId) { return service.get(userId(jwt), workspaceId); }
	@PutMapping("/architecture-document") @Operation(summary = "Save an Architecture Document with optimistic concurrency")
	public ArchitectureDocumentService.DocumentResponse save(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @Valid @RequestBody SaveArchitectureDocumentRequest request) { return service.save(userId(jwt), workspaceId, request.expectedVersion(), request.document()); }
	@PostMapping("/architecture-revisions") @ResponseStatus(HttpStatus.CREATED) @Operation(summary = "Create an immutable Architecture Revision")
	public ArchitectureDocumentService.RevisionResponse createRevision(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId) { return service.createRevision(userId(jwt), workspaceId); }
	@GetMapping("/architecture-revisions/{revisionId}") @Operation(summary = "Get an immutable Architecture Revision")
	public ArchitectureDocumentService.RevisionResponse getRevision(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID revisionId) { return service.getRevision(userId(jwt), workspaceId, revisionId); }
	private UUID userId(Jwt jwt) { return currentUserService.getOrCreate(jwt.getSubject()).id(); }
	public record SaveArchitectureDocumentRequest(@Min(0) long expectedVersion, @NotNull JsonNode document) { }
}
