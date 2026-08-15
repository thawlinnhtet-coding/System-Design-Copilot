package com.example.backend.entitlement.application;

import com.example.backend.billing.application.BillingPlanResolver;
import com.example.backend.identity.application.CurrentUserService;
import io.swagger.v3.oas.annotations.media.Schema;
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
	private final BillingPlanResolver billingPlanResolver;
	private final Clock clock;

	public EntitlementService(
			UserAllowanceStore userAllowanceStore,
			UsageRecordStore usageRecordStore,
			EntitlementProperties properties,
			BillingPlanResolver billingPlanResolver,
			Clock clock
	) {
		this.userAllowanceStore = userAllowanceStore;
		this.usageRecordStore = usageRecordStore;
		this.properties = properties;
		this.billingPlanResolver = billingPlanResolver;
		this.clock = clock;
	}

	@Transactional
	public CurrentEntitlements currentEntitlements(CurrentUserService.CurrentUser user) {
		return currentEntitlements(user.id(), user);
	}

	public CurrentEntitlements currentEntitlements(UUID userId) {
		return currentEntitlements(userId, null);
	}

	/** Curated Challenges are available to every authenticated beta User. Keep this policy in the entitlement boundary. */
	@Transactional(readOnly = true)
	public void requireCuratedChallengeAccess(UUID userId) {
		if (!currentEntitlements(userId).curatedChallengeAccess()) {
			throw new EntitlementRequiredException("curated_challenges");
		}
	}

	private CurrentEntitlements currentEntitlements(UUID userId, CurrentUserService.CurrentUser user) {
		var now = Instant.now(clock);
		var monthStart = startOfMonth(now);
		var billingPlan = user == null ? billingPlanResolver.planFor(userId, now) : billingPlanResolver.planFor(user, now);
		Integer activeWorkspaceLimit = billingPlan.pro() ? null : properties.free().activeWorkspaces();
		Integer copilotTurnLimit = billingPlan.pro() ? null : properties.free().copilotTurnsPerMonth();
		Integer reviewLimit = billingPlan.pro() ? null : properties.free().reviewsPerMonth();
		return new CurrentEntitlements(
				billingPlan.pro() ? "PRO" : "FREE",
				true,
				new Allowance(userAllowanceStore.activeWorkspaceCount(userId), activeWorkspaceLimit),
				new Allowance(usageRecordStore.countSince(userId, UsageOperation.COPILOT_TURN, monthStart), copilotTurnLimit),
				new Allowance(usageRecordStore.countSince(userId, UsageOperation.REVIEW, monthStart), reviewLimit),
				billingPlan.pro() && billingPlan.paidThrough() != null ? billingPlan.paidThrough() : nextMonthStart(now),
				new BillingState(
						billingPlan.status(),
						billingPlan.checkoutAvailable(),
						billingPlan.portalAvailable(),
						billingPlan.pro() ? billingPlan.paidThrough() : null
				)
		);
	}

	@Transactional
	public void registerActiveWorkspace(UUID userId) {
		var activeWorkspaceCount = userAllowanceStore.activeWorkspaceCountForUpdate(userId);
		if (!billingPlanResolver.planFor(userId, Instant.now(clock)).pro() && activeWorkspaceCount >= properties.free().activeWorkspaces()) {
			throw new QuotaExceededException("active_workspaces");
		}
		userAllowanceStore.updateActiveWorkspaceCount(userId, activeWorkspaceCount + 1);
	}

	/** Serialize durable Workspace-create commands for one User before they reserve an idempotency key. */
	@Transactional
	public void lockActiveWorkspaceCount(UUID userId) {
		userAllowanceStore.activeWorkspaceCountForUpdate(userId);
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
		if (!billingPlanResolver.planFor(userId, now).pro()
				&& usageRecordStore.countSince(userId, operation, startOfMonth(now)) >= allowance) {
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
			boolean curatedChallengeAccess,
			Allowance activeWorkspaces,
			Allowance copilotTurns,
			Allowance reviews,
			Instant renewsAt,
			BillingState billing
	) {
	}

	public record BillingState(
			String status,
			boolean checkoutAvailable,
			boolean portalAvailable,
			Instant paidThrough
	) {
	}

	public record Allowance(long used, Integer limit) {

		@Schema(types = {"integer", "null"}, format = "int32")
		@Override
		public Integer limit() {
			return limit;
		}
	}

}
