package com.example.backend.entitlement.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
public class EntitlementService {

	private final UserAllowanceStore userAllowanceStore;
	private final UsageRecordStore usageRecordStore;
	private final EntitlementProperties properties;
	private final Clock clock;

	public EntitlementService(
			UserAllowanceStore userAllowanceStore,
			UsageRecordStore usageRecordStore,
			EntitlementProperties properties,
			Clock clock
	) {
		this.userAllowanceStore = userAllowanceStore;
		this.usageRecordStore = usageRecordStore;
		this.properties = properties;
		this.clock = clock;
	}

	@Transactional
	public CurrentEntitlements currentEntitlements(UUID userId) {
		var now = Instant.now(clock);
		var monthStart = startOfMonth(now);
		return new CurrentEntitlements(
				"FREE",
				new Allowance(userAllowanceStore.activeWorkspaceCount(userId), properties.free().activeWorkspaces()),
				new Allowance(usageRecordStore.countSince(userId, UsageOperation.COPILOT_TURN, monthStart), properties.free().copilotTurnsPerMonth()),
				new Allowance(usageRecordStore.countSince(userId, UsageOperation.REVIEW, monthStart), properties.free().reviewsPerMonth()),
				nextMonthStart(now)
		);
	}

	@Transactional
	public void registerActiveWorkspace(UUID userId) {
		var activeWorkspaceCount = userAllowanceStore.activeWorkspaceCountForUpdate(userId);
		if (activeWorkspaceCount >= properties.free().activeWorkspaces()) {
			throw new QuotaExceededException("active_workspaces");
		}
		userAllowanceStore.updateActiveWorkspaceCount(userId, activeWorkspaceCount + 1);
	}

	@Transactional
	public void unregisterActiveWorkspace(UUID userId) {
		var activeWorkspaceCount = userAllowanceStore.activeWorkspaceCountForUpdate(userId);
		if (activeWorkspaceCount == 0) {
			throw new IllegalStateException("Cannot unregister an active Workspace when none are registered");
		}
		userAllowanceStore.updateActiveWorkspaceCount(userId, activeWorkspaceCount - 1);
	}

	@Transactional
	public void recordAcceptedCopilotTurn(UUID userId, UUID copilotTurnId) {
		recordUsage(userId, UsageOperation.COPILOT_TURN, copilotTurnId, properties.free().copilotTurnsPerMonth(), "copilot_turns");
	}

	@Transactional
	public void recordCompletedReview(UUID userId, UUID reviewRequestId) {
		recordUsage(userId, UsageOperation.REVIEW, reviewRequestId, properties.free().reviewsPerMonth(), "reviews");
	}

	private void recordUsage(UUID userId, UsageOperation operation, UUID operationId, int allowance, String allowanceName) {
		userAllowanceStore.activeWorkspaceCountForUpdate(userId);
		if (usageRecordStore.exists(userId, operation, operationId)) {
			return;
		}
		var now = Instant.now(clock);
		if (usageRecordStore.countSince(userId, operation, startOfMonth(now)) >= allowance) {
			throw new QuotaExceededException(allowanceName);
		}
		usageRecordStore.record(userId, operation, operationId, now);
	}

	private Instant startOfMonth(Instant instant) {
		return YearMonth.from(instant.atZone(ZoneOffset.UTC)).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
	}

	private Instant nextMonthStart(Instant instant) {
		return YearMonth.from(instant.atZone(ZoneOffset.UTC)).plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
	}

	public record CurrentEntitlements(
			String plan,
			Allowance activeWorkspaces,
			Allowance copilotTurns,
			Allowance reviews,
			Instant renewsAt
	) {
	}

	public record Allowance(long used, int limit) {
	}

}
