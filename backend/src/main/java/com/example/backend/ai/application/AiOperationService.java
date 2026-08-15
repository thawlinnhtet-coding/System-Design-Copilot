package com.example.backend.ai.application;

import com.example.backend.ai.application.AiProviderExceptions.DailyBudgetExceededException;
import com.example.backend.ai.application.AiProviderExceptions.UnavailableException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

/** Shared application boundary for future Copilot and Review operations. */
@Service
public class AiOperationService {

	private static final BigDecimal ZERO_COST = BigDecimal.ZERO;

	private final AiOperationAuthorizer authorizer;
	private final AiProviderBoundary providerBoundary;
	private final AiProviderPort provider;
	private final AiOperationStore operationStore;
	private final Clock clock;

	public AiOperationService(
			AiOperationAuthorizer authorizer,
			AiProviderBoundary providerBoundary,
			AiProviderPort provider,
			AiOperationStore operationStore,
			Clock clock
	) {
		this.authorizer = authorizer;
		this.providerBoundary = providerBoundary;
		this.provider = provider;
		this.operationStore = operationStore;
		this.clock = clock;
	}

	@Transactional
	public AiOperationResult invoke(
			UUID userId,
			AiProfile profile,
			AiBoundedContext context,
			BigDecimal estimatedCostUsd,
			String promptVersion
	) {
		return invoke(UUID.randomUUID(), userId, profile, context, estimatedCostUsd, promptVersion);
	}

	@Transactional
	public AiOperationResult invoke(
			UUID operationId,
			UUID userId,
			AiProfile profile,
			AiBoundedContext context,
			BigDecimal estimatedCostUsd,
			String promptVersion
	) {
		if (profile == null) {
			throw new IllegalArgumentException("AI profile must not be null");
		}
		if (estimatedCostUsd == null || estimatedCostUsd.signum() < 0) {
			throw new IllegalArgumentException("Estimated AI cost must not be negative");
		}
		if (promptVersion == null || promptVersion.isBlank() || promptVersion.length() > 64) {
			throw new IllegalArgumentException("AI prompt version must be present and at most 64 characters");
		}

		authorizer.requireAuthorized(userId, context.workspaceId());
		var model = providerBoundary.profile(profile).model();
		var startedAt = Instant.now(clock);
		try {
			var spentToday = operationStore.chargedCostSince(startOfUtcDay(startedAt));
			providerBoundary.budgetPolicy().requireAvailable(spentToday, estimatedCostUsd);
		} catch (DailyBudgetExceededException exception) {
			operationStore.save(new AiOperation(
					operationId, userId, context.workspaceId(), profile, AiOperationStatus.BUDGET_REJECTED,
					model, null, promptVersion, null, null, null, estimatedCostUsd, ZERO_COST,
					0L, "ai_daily_budget_reached", null, startedAt, startedAt
			));
			throw exception;
		}

		try {
			var response = provider.invoke(providerBoundary.request(profile, context.text()));
			if (response == null || response.content() == null || response.content().isBlank()
					|| response.content().length() > 100_000) {
				throw new UnavailableException();
			}
			var completedAt = Instant.now(clock);
			var chargedCost = response.costUsd() == null ? estimatedCostUsd : response.costUsd();
			var operation = new AiOperation(
					operationId, userId, context.workspaceId(), profile, AiOperationStatus.ACCEPTED,
					safeModel(response.model(), model), safeMetadata(response.providerRequestId(), 255), promptVersion,
					response.inputTokens(), response.outputTokens(), totalTokens(response), estimatedCostUsd, chargedCost,
					latencyMillis(startedAt, completedAt), null, response.content(), startedAt, completedAt
			);
			operationStore.save(operation);
			return new AiOperationResult(operationId, profile, operation.model(), response.content());
		} catch (UnavailableException exception) {
			var completedAt = Instant.now(clock);
			operationStore.save(new AiOperation(
					operationId, userId, context.workspaceId(), profile, AiOperationStatus.PROVIDER_FAILED,
					model, null, promptVersion, null, null, null, estimatedCostUsd, estimatedCostUsd,
					latencyMillis(startedAt, completedAt), outcomeCode(exception), null, startedAt, completedAt
			));
			throw exception;
		}
	}

	public AiOperationResult accepted(UUID operationId, UUID userId, UUID workspaceId, AiProfile profile) {
		return operationStore.findById(operationId)
				.filter(operation -> operation.userId().equals(userId) && operation.workspaceId().equals(workspaceId) && operation.profile() == profile && operation.status() == AiOperationStatus.ACCEPTED)
				.map(operation -> new AiOperationResult(operation.id(), operation.profile(), operation.model(), operation.acceptedOutput()))
				.orElse(null);
	}

	private String outcomeCode(UnavailableException exception) {
		return exception instanceof AiProviderExceptions.NoEligibleProviderException
				? "ai_no_eligible_provider" : "ai_provider_unavailable";
	}

	private Integer totalTokens(AiProviderResponse response) {
		if (response.inputTokens() == null || response.outputTokens() == null) {
			return null;
		}
		return response.inputTokens() + response.outputTokens();
	}

	private String safeModel(String providerModel, String configuredModel) {
		return providerModel == null || providerModel.isBlank() || providerModel.length() > 255
				? configuredModel : providerModel;
	}

	private String safeMetadata(String value, int maxLength) {
		return value == null || value.isBlank() || value.length() > maxLength ? null : value;
	}

	private Instant startOfUtcDay(Instant instant) {
		return LocalDate.ofInstant(instant, ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant();
	}

	private long latencyMillis(Instant startedAt, Instant completedAt) {
		return Duration.between(startedAt, completedAt).toMillis();
	}

	public record AiOperationResult(UUID operationId, AiProfile profile, String model, String content) {
	}
}
