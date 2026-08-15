package com.example.backend.workspace.application;

import com.example.backend.entitlement.application.EntitlementService;
import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.workspace.application.WorkspaceExceptions.WorkspaceNotFoundException;
import com.example.backend.workspace.application.WorkspaceExceptions.InvalidWorkspaceTypeSourceException;
import com.example.backend.workspace.infrastructure.WorkspaceEntity;
import com.example.backend.workspace.infrastructure.WorkspaceRepository;
import com.example.backend.workspace.infrastructure.WorkspaceStatus;
import com.example.backend.workspace.infrastructure.WorkspaceSource;
import com.example.backend.workspace.infrastructure.WorkspaceType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class WorkspaceService implements WorkspaceAccess, WorkspaceMetadataProvider {

	private final WorkspaceRepository workspaceRepository;
	private final EntitlementService entitlementService;
	private final WorkspaceDataCleanup workspaceDataCleanup;
	private final Clock clock;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public WorkspaceService(
		WorkspaceRepository workspaceRepository,
		EntitlementService entitlementService,
		@Lazy WorkspaceDataCleanup workspaceDataCleanup,
		Clock clock
	) {
		this.workspaceRepository = workspaceRepository;
		this.entitlementService = entitlementService;
		this.workspaceDataCleanup = workspaceDataCleanup;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public List<WorkspaceSummary> list(UUID userId) {
		return workspaceRepository.findAllByUserIdOrderByUpdatedAtDesc(userId).stream()
				.map(this::summary)
				.toList();
	}

	@Transactional(readOnly = true)
	public WorkspaceSummary get(UUID userId, UUID workspaceId) {
		return summary(ownedWorkspace(userId, workspaceId));
	}

	@Override
	@Transactional(readOnly = true)
	public void requireOwned(UUID userId, UUID workspaceId) {
		ownedWorkspace(userId, workspaceId);
	}

	@Override
	@Transactional(readOnly = true)
	public void requireEditable(UUID userId, UUID workspaceId) {
		var workspace = ownedWorkspace(userId, workspaceId);
		if (workspace.getStatus() != WorkspaceStatus.ACTIVE) {
			throw new WorkspaceExceptions.WorkspaceArchivedException();
		}
	}

	@Override
	@Transactional(readOnly = true)
	public WorkspaceMetadata ownedMetadata(UUID userId, UUID workspaceId) {
		var workspace = ownedWorkspace(userId, workspaceId);
		return new WorkspaceMetadata(workspace.getId(), workspace.getName());
	}

	@Transactional
	public WorkspaceSummary create(UUID userId, String name, String description, WorkspaceType type, WorkspaceSource source) {
		validateTypeAndSource(type, source);
		if (type == WorkspaceType.CHALLENGE) {
			throw new InvalidWorkspaceTypeSourceException();
		}
		entitlementService.registerActiveWorkspace(userId);
		var workspace = workspaceRepository.save(new WorkspaceEntity(userId, name, description, type, source, now()));
		return summary(workspace);
	}

	@Transactional
	public WorkspaceSummary createCustomDesign(UUID userId, String name, String systemIdea) {
		return create(userId, name, systemIdea, WorkspaceType.CUSTOM_DESIGN, WorkspaceSource.CUSTOM_DESIGN);
	}

	@Transactional
	public WorkspaceSummary createChallenge(UUID userId, String name, String description, UUID challengeVersionId, String challengeSnapshot) {
		entitlementService.registerActiveWorkspace(userId);
		var workspace = workspaceRepository.save(new WorkspaceEntity(
				userId, name, description, WorkspaceType.CHALLENGE, WorkspaceSource.CURATED_CHALLENGE, challengeVersionId, challengeSnapshot, now()));
		return summary(workspace);
	}

	@Transactional
	public WorkspaceSummary rename(UUID userId, UUID workspaceId, String name) {
		var workspace = ownedWorkspace(userId, workspaceId);
		workspace.rename(name, now());
		return summary(workspace);
	}

	@Transactional
	public WorkspaceSummary updateFocus(UUID userId, UUID workspaceId, String focusStage, String focusPanel, JsonNode canvasViewport) {
		var workspace = ownedWorkspace(userId, workspaceId);
		if (workspace.getStatus() != WorkspaceStatus.ACTIVE) {
			throw new WorkspaceExceptions.WorkspaceArchivedException();
		}
		if (!Set.of("CLARIFY", "DESIGN", "STRESS", "REVIEW").contains(focusStage)
				|| !Set.of("REASONING", "CANVAS", "SCENARIOS", "REVIEW").contains(focusPanel)) {
			throw new WorkspaceExceptions.InvalidWorkspaceFocusException();
		}
		if (canvasViewport == null || !canvasViewport.isObject()
				|| canvasViewport.size() != 3
				|| !canvasViewport.path("x").isNumber()
				|| !canvasViewport.path("y").isNumber()
				|| !canvasViewport.path("zoom").isNumber()
				|| Math.abs(canvasViewport.path("x").asDouble()) > 100_000
				|| Math.abs(canvasViewport.path("y").asDouble()) > 100_000
				|| canvasViewport.path("zoom").asDouble() < 0.1
				|| canvasViewport.path("zoom").asDouble() > 4.0) {
			throw new WorkspaceExceptions.InvalidWorkspaceFocusException();
		}
		workspace.updateFocus(focusStage, focusPanel, objectMapper.writeValueAsString(canvasViewport), now());
		return summary(workspace);
	}

	@Transactional
	public WorkspaceSummary archive(UUID userId, UUID workspaceId) {
		var workspace = ownedWorkspace(userId, workspaceId);
		if (workspace.getStatus() == WorkspaceStatus.ACTIVE) {
			entitlementService.unregisterActiveWorkspace(userId);
			workspace.archive(now());
		}
		return summary(workspace);
	}

	@Transactional
	public WorkspaceSummary restore(UUID userId, UUID workspaceId) {
		var workspace = ownedWorkspace(userId, workspaceId);
		if (workspace.getStatus() == WorkspaceStatus.ARCHIVED) {
			entitlementService.registerActiveWorkspace(userId);
			workspace.restore(now());
		}
		return summary(workspace);
	}

	@Transactional
	public void delete(UUID userId, UUID workspaceId) {
		var workspace = ownedWorkspace(userId, workspaceId);
		if (workspace.getStatus() == WorkspaceStatus.ACTIVE) {
			entitlementService.unregisterActiveWorkspace(userId);
		}
		workspaceDataCleanup.deleteForWorkspace(workspaceId);
		workspaceRepository.delete(workspace);
	}

	private WorkspaceEntity ownedWorkspace(UUID userId, UUID workspaceId) {
		return workspaceRepository.findByIdAndUserId(workspaceId, userId)
				.orElseThrow(WorkspaceNotFoundException::new);
	}

	private Instant now() {
		return Instant.now(clock);
	}

	private WorkspaceSummary summary(WorkspaceEntity workspace) {
		return new WorkspaceSummary(
				workspace.getId(),
				workspace.getName(),
				workspace.getDescription(),
				workspace.getType(),
				workspace.getSource(),
				workspace.getChallengeVersionId(),
				workspace.getStatus().name(),
				workspace.getProgressPercent(),
				workspace.getSaveState(),
				workspace.getLatestReviewState(),
				reviewBriefRequired(workspace.getSource()),
				workspace.getFocusStage(),
				workspace.getFocusPanel(),
				canvasViewport(workspace.getCanvasViewport()),
				workspace.getType() == WorkspaceType.CUSTOM_DESIGN ? "Make the system needs explicit." : null,
				workspace.getType() == WorkspaceType.CUSTOM_DESIGN ? "Add your first Requirement or open the blank Canvas." : null,
				workspace.getCreatedAt(),
				workspace.getUpdatedAt()
		);
	}

	private boolean reviewBriefRequired(WorkspaceSource source) {
		return source == WorkspaceSource.IMPORT_PACKAGE || source == WorkspaceSource.MANUAL_RECREATION;
	}

	private void validateTypeAndSource(WorkspaceType type, WorkspaceSource source) {
		var valid = switch (type) {
			case CHALLENGE -> source == WorkspaceSource.CURATED_CHALLENGE;
			case CUSTOM_DESIGN -> source == WorkspaceSource.CUSTOM_DESIGN;
			case ARCHITECTURE_REVIEW -> source == WorkspaceSource.IMPORT_PACKAGE || source == WorkspaceSource.MANUAL_RECREATION;
		};
		if (!valid) {
			throw new InvalidWorkspaceTypeSourceException();
		}
	}

	public record WorkspaceSummary(
			UUID id,
			String name,
			String description,
			WorkspaceType type,
			WorkspaceSource source,
			UUID challengeVersionId,
			String status,
			int progressPercent,
			String saveState,
			String latestReviewState,
		boolean reviewBriefRequired,
		String focusStage,
		String focusPanel,
		CanvasViewport canvasViewport,
		String clarifyPrompt,
		String suggestedNextAction,
		Instant createdAt,
			Instant updatedAt
	) {
	}

	public record CanvasViewport(double x, double y, double zoom) {
	}

	private CanvasViewport canvasViewport(String value) {
		var node = read(value);
		return new CanvasViewport(node.path("x").asDouble(), node.path("y").asDouble(), node.path("zoom").asDouble());
	}

	private JsonNode read(String value) {
		try {
			return objectMapper.readTree(value);
		} catch (RuntimeException exception) {
			throw new IllegalStateException("Stored Workspace focus state is invalid", exception);
		}
	}

}
