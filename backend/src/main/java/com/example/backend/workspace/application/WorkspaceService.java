package com.example.backend.workspace.application;

import com.example.backend.entitlement.application.EntitlementService;
import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.workspace.application.WorkspaceExceptions.WorkspaceNotFoundException;
import com.example.backend.workspace.infrastructure.WorkspaceEntity;
import com.example.backend.workspace.infrastructure.WorkspaceRepository;
import com.example.backend.workspace.infrastructure.WorkspaceStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class WorkspaceService implements WorkspaceAccess {

	private final WorkspaceRepository workspaceRepository;
	private final EntitlementService entitlementService;
	private final WorkspaceDataCleanup workspaceDataCleanup;
	private final Clock clock;

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

	@Transactional
	public WorkspaceSummary create(UUID userId, String name, String description) {
		entitlementService.registerActiveWorkspace(userId);
		var workspace = workspaceRepository.save(new WorkspaceEntity(userId, name, description, now()));
		return summary(workspace);
	}

	@Transactional
	public WorkspaceSummary rename(UUID userId, UUID workspaceId, String name) {
		var workspace = ownedWorkspace(userId, workspaceId);
		workspace.rename(name, now());
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
				workspace.getSource(),
				workspace.getStatus().name(),
				workspace.getProgressPercent(),
				workspace.getSaveState(),
				workspace.getLatestReviewState(),
				workspace.getCreatedAt(),
				workspace.getUpdatedAt()
		);
	}

	public record WorkspaceSummary(
			UUID id,
			String name,
			String description,
			String source,
			String status,
			int progressPercent,
			String saveState,
			String latestReviewState,
			Instant createdAt,
			Instant updatedAt
	) {
	}

}
