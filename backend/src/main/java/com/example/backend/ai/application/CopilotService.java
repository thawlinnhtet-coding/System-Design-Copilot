package com.example.backend.ai.application;

import com.example.backend.entitlement.application.EntitlementService;
import com.example.backend.entitlement.application.QuotaExceededException;
import com.example.backend.workspace.application.WorkspaceAccess;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import reactor.core.publisher.Flux;

@Service
public class CopilotService {
	private static final BigDecimal ESTIMATED_COST_USD = new BigDecimal("0.002000");
	private static final String PROMPT_VERSION = "copilot-advisory-v1";
	private final WorkspaceAccess workspaces;
	private final CopilotContextAssembler contextAssembler;
	private final AiOperationService operations;
	private final EntitlementService entitlements;

	public CopilotService(WorkspaceAccess workspaces, CopilotContextAssembler contextAssembler, AiOperationService operations, EntitlementService entitlements) {
		this.workspaces = workspaces; this.contextAssembler = contextAssembler; this.operations = operations; this.entitlements = entitlements;
	}

	@Transactional
	public CopilotTurn answer(UUID userId, UUID workspaceId, UUID clientTurnId, String question) {
		workspaces.requireEditable(userId, workspaceId);
		var existing = operations.accepted(clientTurnId, userId, workspaceId, AiProfile.COPILOT);
		if (existing != null) return new CopilotTurn(existing.operationId(), existing.content(), existing.model(), true);
		var allowance = entitlements.currentEntitlements(userId).copilotTurns();
		if (allowance.limit() != null && allowance.used() >= allowance.limit()) throw new QuotaExceededException("copilot_turns");
		var result = operations.invoke(clientTurnId, userId, AiProfile.COPILOT, contextAssembler.assemble(userId, workspaceId, question), ESTIMATED_COST_USD, PROMPT_VERSION);
		entitlements.recordAcceptedCopilotTurn(userId, result.operationId());
		return new CopilotTurn(result.operationId(), result.content(), result.model(), false);
	}

	@Transactional
	public Flux<AiOperationService.AiStreamChunk> stream(UUID userId, UUID workspaceId, UUID clientTurnId, String question) {
		workspaces.requireEditable(userId, workspaceId);
		var existing = operations.accepted(clientTurnId, userId, workspaceId, AiProfile.COPILOT);
		if (existing != null) {
			return Flux.fromArray(existing.content().split("(?<=\\s)", -1)).filter(part -> !part.isBlank()).map(part -> new AiOperationService.AiStreamChunk(existing.operationId(), part, existing.model()));
		}
		var allowance = entitlements.currentEntitlements(userId).copilotTurns();
		if (allowance.limit() != null && allowance.used() >= allowance.limit()) throw new QuotaExceededException("copilot_turns");
		return operations.stream(clientTurnId, userId, AiProfile.COPILOT, contextAssembler.assemble(userId, workspaceId, question), ESTIMATED_COST_USD, PROMPT_VERSION)
				.doOnComplete(() -> entitlements.recordAcceptedCopilotTurn(userId, clientTurnId));
	}

	public record CopilotTurn(UUID id, String content, String model, boolean replayed) { }
}
