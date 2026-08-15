package com.example.backend.review.api;

import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.review.application.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController @RequestMapping("/api/v1/workspaces/{workspaceId}/reviews") @SecurityRequirement(name="clerkBearerAuth")
public class ReviewController {
	private final CurrentUserService users; private final ReviewService service;
	public ReviewController(CurrentUserService users,ReviewService service){this.users=users;this.service=service;}
	@PostMapping @ResponseStatus(HttpStatus.ACCEPTED) @Operation(summary="Request an asynchronous Review of an immutable Architecture Revision")
	public ReviewService.ReviewSubmission submit(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID workspaceId,@Parameter(in=ParameterIn.HEADER,required=true,description="Caller-generated idempotency key") @RequestHeader("Idempotency-Key") String idempotencyKey){return service.submit(users.getOrCreate(jwt.getSubject()).id(),workspaceId,idempotencyKey);}
	@GetMapping("/{reviewRequestId}") @Operation(summary="Get the current durable Review request status")
	public ReviewService.ReviewSubmission get(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID workspaceId,@PathVariable UUID reviewRequestId){var result=service.get(users.getOrCreate(jwt.getSubject()).id(),reviewRequestId);if(!result.workspaceId().equals(workspaceId))throw new IllegalArgumentException("Review request not found");return result;}
}
