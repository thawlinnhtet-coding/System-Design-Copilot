package com.example.backend.reasoning.api;

import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.reasoning.application.ReasoningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/reasoning")
@SecurityRequirement(name = "clerkBearerAuth")
public class ReasoningController {

	private final CurrentUserService currentUserService;
	private final ReasoningService reasoningService;

	public ReasoningController(CurrentUserService currentUserService, ReasoningService reasoningService) {
		this.currentUserService = currentUserService;
		this.reasoningService = reasoningService;
	}

	@GetMapping
	@Operation(summary = "Get Workspace reasoning records")
	public ReasoningService.ReasoningResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId) {
		return reasoningService.get(userId(jwt), workspaceId);
	}

	@PostMapping("/requirements")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create a Requirement")
	public ReasoningService.RequirementResponse createRequirement(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @Valid @RequestBody RequirementRequest request) {
		return reasoningService.createRequirement(userId(jwt), workspaceId, request.input());
	}

	@PatchMapping("/requirements/{id}")
	@Operation(summary = "Update a Requirement")
	public ReasoningService.RequirementResponse updateRequirement(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID id, @Valid @RequestBody RequirementRequest request) {
		return reasoningService.updateRequirement(userId(jwt), workspaceId, id, request.input());
	}

	@DeleteMapping("/requirements/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Delete a Requirement")
	public void deleteRequirement(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID id) {
		reasoningService.deleteRequirement(userId(jwt), workspaceId, id);
	}

	@PostMapping("/assumptions")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create an Assumption")
	public ReasoningService.AssumptionResponse createAssumption(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @Valid @RequestBody AssumptionRequest request) {
		return reasoningService.createAssumption(userId(jwt), workspaceId, request.input());
	}

	@PatchMapping("/assumptions/{id}")
	@Operation(summary = "Update an Assumption")
	public ReasoningService.AssumptionResponse updateAssumption(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID id, @Valid @RequestBody AssumptionRequest request) {
		return reasoningService.updateAssumption(userId(jwt), workspaceId, id, request.input());
	}

	@DeleteMapping("/assumptions/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Delete an Assumption")
	public void deleteAssumption(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID id) {
		reasoningService.deleteAssumption(userId(jwt), workspaceId, id);
	}

	@PostMapping("/questions")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create an Unresolved Question")
	public ReasoningService.QuestionResponse createQuestion(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @Valid @RequestBody QuestionRequest request) {
		return reasoningService.createQuestion(userId(jwt), workspaceId, request.input());
	}

	@PatchMapping("/questions/{id}")
	@Operation(summary = "Update an Unresolved Question")
	public ReasoningService.QuestionResponse updateQuestion(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID id, @Valid @RequestBody QuestionRequest request) {
		return reasoningService.updateQuestion(userId(jwt), workspaceId, id, request.input());
	}

	@DeleteMapping("/questions/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Delete an Unresolved Question")
	public void deleteQuestion(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID id) {
		reasoningService.deleteQuestion(userId(jwt), workspaceId, id);
	}

	@PostMapping("/decisions")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create a Decision")
	public ReasoningService.DecisionResponse createDecision(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @Valid @RequestBody DecisionRequest request) {
		return reasoningService.createDecision(userId(jwt), workspaceId, request.input());
	}

	@PatchMapping("/decisions/{id}")
	@Operation(summary = "Update a Decision")
	public ReasoningService.DecisionResponse updateDecision(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID id, @Valid @RequestBody DecisionRequest request) {
		return reasoningService.updateDecision(userId(jwt), workspaceId, id, request.input());
	}

	@DeleteMapping("/decisions/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Delete a Decision")
	public void deleteDecision(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @PathVariable UUID id) {
		reasoningService.deleteDecision(userId(jwt), workspaceId, id);
	}

	@PutMapping("/review-brief")
	@Operation(summary = "Create or update a Review Brief")
	public ReasoningService.ReviewBriefResponse saveReviewBrief(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId, @Valid @RequestBody ReviewBriefRequest request) {
		return reasoningService.saveReviewBrief(userId(jwt), workspaceId, new ReasoningService.ReviewBriefInput(request.systemDescription(), request.reviewGoal()));
	}

	private UUID userId(Jwt jwt) {
		return currentUserService.getOrCreate(jwt.getSubject()).id();
	}

	public record RequirementRequest(
			@NotBlank @Size(max = 32) String kind,
			@NotBlank @Size(max = 2000) String statement,
			@NotBlank @Size(max = 32) String priority,
			@NotBlank @Size(max = 32) String status,
			@Size(max = 500) String measurableTarget,
			@Size(max = 2000) String rationale,
			@Size(max = 500) String source,
			@Min(0) Integer orderIndex
	) {
		ReasoningService.RequirementInput input() { return new ReasoningService.RequirementInput(kind, statement.trim(), priority, status, measurableTarget, rationale, source, orderIndex); }
	}

	public record AssumptionRequest(
			@NotBlank @Size(max = 64) String category,
			@Size(max = 500) String quantitativeValue,
			@Size(max = 64) String unit,
			@Size(max = 2000) String rationale,
			@NotBlank @Size(max = 32) String confidence,
			@NotBlank @Size(max = 32) String status,
			@Size(max = 500) String source,
			List<UUID> relatedRequirementIds,
			@Min(0) Integer orderIndex
	) {
		ReasoningService.AssumptionInput input() { return new ReasoningService.AssumptionInput(category.trim(), quantitativeValue, unit, rationale, confidence, status, source, relatedRequirementIds, orderIndex); }
	}

	public record QuestionRequest(
			@NotBlank @Size(max = 2000) String question,
			@NotBlank @Size(max = 2000) String whyItMatters,
			@NotBlank @Size(max = 32) String status,
			@Size(max = 2000) String resolutionNotes,
			List<UUID> relatedRequirementIds,
			List<UUID> relatedAssumptionIds,
			UUID resultingDecisionId,
			@Min(0) Integer orderIndex
	) {
		ReasoningService.QuestionInput input() { return new ReasoningService.QuestionInput(question.trim(), whyItMatters.trim(), status, resolutionNotes, relatedRequirementIds, relatedAssumptionIds, resultingDecisionId, orderIndex); }
	}

	public record DecisionRequest(
			@NotBlank @Size(max = 500) String title,
			@NotBlank @Size(max = 1000) String chosenOption,
			@NotBlank @Size(max = 2000) String rationale,
			@Size(max = 2000) String alternatives,
			@Size(max = 2000) String positiveConsequences,
			@Size(max = 2000) String risks,
			@NotBlank @Size(max = 32) String status,
			List<@Size(max = 200) String> evidenceRefs,
			@Min(0) Integer orderIndex
	) {
		ReasoningService.DecisionInput input() { return new ReasoningService.DecisionInput(title.trim(), chosenOption.trim(), rationale.trim(), alternatives, positiveConsequences, risks, status, evidenceRefs, orderIndex); }
	}

	public record ReviewBriefRequest(
			@NotBlank @Size(max = 4000) String systemDescription,
			@NotBlank @Size(max = 2000) String reviewGoal
	) {
	}
}
