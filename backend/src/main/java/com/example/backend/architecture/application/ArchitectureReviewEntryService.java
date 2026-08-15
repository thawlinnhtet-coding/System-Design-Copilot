package com.example.backend.architecture.application;

import com.example.backend.reasoning.application.ReasoningService;
import com.example.backend.entitlement.application.EntitlementService;
import com.example.backend.workspace.application.WorkspaceService;
import com.example.backend.workspace.infrastructure.WorkspaceSource;
import com.example.backend.workspace.infrastructure.WorkspaceType;
import com.example.backend.architecture.application.ArchitectureReviewEntryExceptions.IdempotencyConflictException;
import com.example.backend.architecture.infrastructure.ArchitectureReviewEntryRequestEntity;
import com.example.backend.architecture.infrastructure.ArchitectureReviewEntryRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ArchitectureReviewEntryService {

	private final WorkspaceService workspaceService;
	private final ReasoningService reasoningService;
	private final ArchitectureReviewEntryRequestRepository requestRepository;
	private final EntitlementService entitlementService;
	private final Clock clock;

	public ArchitectureReviewEntryService(
		WorkspaceService workspaceService,
		ReasoningService reasoningService,
		ArchitectureReviewEntryRequestRepository requestRepository,
		EntitlementService entitlementService,
		Clock clock
	) {
		this.workspaceService = workspaceService;
		this.reasoningService = reasoningService;
		this.requestRepository = requestRepository;
		this.entitlementService = entitlementService;
		this.clock = clock;
	}

	@Transactional
	public WorkspaceService.WorkspaceSummary createManualRecreation(
		UUID userId,
		String idempotencyKey,
		ManualRecreationInput input
	) {
		var normalized = input.normalized();
		var fingerprint = fingerprint(normalized);
		entitlementService.lockActiveWorkspaceCount(userId);
		var existing = requestRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
		if (existing.isPresent()) {
			var request = existing.get();
			if (!request.getRequestFingerprint().equals(fingerprint)) {
				throw new IdempotencyConflictException();
			}
			if (request.getWorkspaceId() != null) {
				return workspaceService.get(userId, request.getWorkspaceId());
			}
		}

		var request = existing.orElseGet(() -> requestRepository.saveAndFlush(
			new ArchitectureReviewEntryRequestEntity(userId, idempotencyKey, fingerprint, Instant.now(clock))));
		var workspace = workspaceService.create(userId, normalized.name(), normalized.systemDescription(), WorkspaceType.ARCHITECTURE_REVIEW, WorkspaceSource.MANUAL_RECREATION);
		var workspaceId = workspace.id();

		for (var statement : normalized.knownRequirements()) {
			reasoningService.createRequirement(userId, workspaceId, new ReasoningService.RequirementInput(
				"FUNCTIONAL", statement, "MUST", "OPEN", null, null, "Manual recreation", null));
		}
		for (var assumption : normalized.knownAssumptions()) {
			reasoningService.createAssumption(userId, workspaceId, new ReasoningService.AssumptionInput(
				"Known assumption", null, null, assumption, "MEDIUM", "ACTIVE", "Manual recreation", List.of(), null));
		}
		reasoningService.saveReviewBrief(userId, workspaceId, new ReasoningService.ReviewBriefInput(normalized.systemDescription(), normalized.reviewGoal()));
		request.complete(workspaceId);
		return workspaceService.get(userId, workspaceId);
	}

	private String fingerprint(ManualRecreationInput input) {
		var value = String.join("\u0000", input.name(), input.systemDescription(), input.reviewGoal(), String.join("\u0001", input.knownRequirements()), String.join("\u0001", input.knownAssumptions()));
		try {
			var digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
			return java.util.HexFormat.of().formatHex(digest);
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is unavailable", exception);
		}
	}

	public record ManualRecreationInput(
		String name,
		String systemDescription,
		String reviewGoal,
		List<String> knownRequirements,
		List<String> knownAssumptions
	) {
		private ManualRecreationInput normalized() {
			return new ManualRecreationInput(name.trim(), systemDescription.trim(), reviewGoal.trim(), values(knownRequirements), values(knownAssumptions));
		}

		private static List<String> values(List<String> values) {
			return values == null ? List.of() : values.stream().map(String::trim).filter(value -> !value.isEmpty()).toList();
		}
	}
}
