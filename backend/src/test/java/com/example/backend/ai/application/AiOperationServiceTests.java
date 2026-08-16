package com.example.backend.ai.application;

import com.example.backend.workspace.application.WorkspaceAccess;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiOperationServiceTests {

	private static final String POLICY_VERSION = "2026-08-01";
	private static final String PROMPT_VERSION = "copilot-v1";
	private static final Instant NOW = Instant.parse("2026-08-14T10:15:30Z");
	private static final UUID USER_ID = UUID.randomUUID();
	private static final UUID WORKSPACE_ID = UUID.randomUUID();

	@Test
	void authorizesConsentAndWorkspaceBeforePersistingAcceptedProviderMetadata() {
		var store = new InMemoryOperationStore();
		var provider = new StubProvider(new AiProviderResponse("advisory answer", "req-123", "copilot-model", 10, 6, null));
		var service = service(store, provider, BigDecimal.ZERO);
		grantConsent(service.consentService);

		var result = service.operationService.invoke(
				USER_ID,
				AiProfile.COPILOT,
				new AiBoundedContext(WORKSPACE_ID, "bounded Workspace context"),
				new BigDecimal("0.01"),
				PROMPT_VERSION
		);

		assertEquals("advisory answer", result.content());
		assertEquals(1, provider.invocations);
		var operation = store.operations.get(0);
		assertEquals(AiOperationStatus.ACCEPTED, operation.status());
		assertEquals("req-123", operation.providerRequestId());
		assertEquals(16, operation.totalTokens());
		assertEquals("advisory answer", operation.acceptedOutput());
		assertEquals(new BigDecimal("0.01"), operation.chargedCostUsd());
	}

	@Test
	void withdrawalBlocksProviderInvocationAndDoesNotPersistAnAcceptedOperation() {
		var store = new InMemoryOperationStore();
		var provider = new StubProvider(new AiProviderResponse("must not be returned", "req", "model"));
		var service = service(store, provider, BigDecimal.ZERO);
		grantConsent(service.consentService);
		service.consentService.withdraw(USER_ID);

		assertThrows(AiConsentExceptions.AiConsentRequiredException.class, () -> service.operationService.invoke(
				USER_ID, AiProfile.REVIEW, new AiBoundedContext(WORKSPACE_ID, "bounded context"),
				new BigDecimal("0.01"), PROMPT_VERSION));

		assertEquals(0, provider.invocations);
		assertTrue(store.operations.isEmpty());
	}

	@Test
	void dailyBudgetRejectsBeforeProviderCallAndRecordsSafeOutcome() {
		var store = new InMemoryOperationStore();
		store.chargedToday = new BigDecimal("0.10");
		var provider = new StubProvider(new AiProviderResponse("must not be returned", "req", "model"));
		var service = service(store, provider, store.chargedToday);
		grantConsent(service.consentService);

		assertThrows(AiProviderExceptions.DailyBudgetExceededException.class, () -> service.operationService.invoke(
				USER_ID, AiProfile.COPILOT, new AiBoundedContext(WORKSPACE_ID, "bounded context"),
				new BigDecimal("0.01"), PROMPT_VERSION));

		assertEquals(0, provider.invocations);
		assertEquals(AiOperationStatus.BUDGET_REJECTED, store.operations.get(0).status());
		assertEquals("ai_daily_budget_reached", store.operations.get(0).outcomeCode());
		assertEquals(BigDecimal.ZERO, store.operations.get(0).chargedCostUsd());
	}

	@Test
	void dailyBudgetAdmissionReservesTheLastAvailableAmountBeforeAnotherOperationCanStart() {
		var store = new InMemoryOperationStore();
		store.chargedToday = new BigDecimal("0.090000");
		var provider = new StubProvider(new AiProviderResponse("advisory answer", "req", "model"));
		var service = service(store, provider, store.chargedToday);
		grantConsent(service.consentService);

		service.operationService.invoke(USER_ID, AiProfile.COPILOT,
				new AiBoundedContext(WORKSPACE_ID, "bounded Workspace context"), new BigDecimal("0.010000"), PROMPT_VERSION);

		assertThrows(AiProviderExceptions.DailyBudgetExceededException.class, () -> service.operationService.invoke(
				USER_ID, AiProfile.COPILOT, new AiBoundedContext(WORKSPACE_ID, "another bounded Workspace context"),
				new BigDecimal("0.001000"), PROMPT_VERSION));
		assertEquals(1, provider.invocations);
		assertEquals(AiOperationStatus.BUDGET_REJECTED, store.operations.get(1).status());
	}

	@Test
	void providerFailureIsObservableWithoutAcceptedOutput() {
		var store = new InMemoryOperationStore();
		var provider = new StubProvider(null);
		provider.failure = new AiProviderExceptions.UnavailableException();
		var service = service(store, provider, BigDecimal.ZERO);
		grantConsent(service.consentService);

		assertThrows(AiProviderExceptions.UnavailableException.class, () -> service.operationService.invoke(
				USER_ID, AiProfile.REVIEW, new AiBoundedContext(WORKSPACE_ID, "bounded context"),
				new BigDecimal("0.02"), PROMPT_VERSION));

		var operation = store.operations.get(0);
		assertEquals(AiOperationStatus.PROVIDER_FAILED, operation.status());
		assertEquals("ai_provider_unavailable", operation.outcomeCode());
		assertEquals(new BigDecimal("0.02"), operation.chargedCostUsd());
		assertFalse(operation.acceptedOutput() != null);
	}

	@Test
	void returnsTheSameAcceptedTurnWithoutInvokingTheProviderAgain() {
		var store = new InMemoryOperationStore();
		var provider = new StubProvider(new AiProviderResponse("advisory answer", "req", "model"));
		var service = service(store, provider, BigDecimal.ZERO);
		grantConsent(service.consentService);
		var id = UUID.randomUUID();

		var first = service.operationService.invoke(id, USER_ID, AiProfile.COPILOT, new AiBoundedContext(WORKSPACE_ID, "bounded context"), new BigDecimal("0.01"), PROMPT_VERSION);
		var replay = service.operationService.accepted(id, USER_ID, WORKSPACE_ID, AiProfile.COPILOT);

		assertEquals(first.operationId(), replay.operationId());
		assertEquals("advisory answer", replay.content());
		assertEquals(1, provider.invocations);
	}

	private ServiceFixture service(InMemoryOperationStore operationStore, StubProvider provider, BigDecimal ignored) {
		var clock = Clock.fixed(NOW, ZoneOffset.UTC);
		var consentStore = new InMemoryConsentStore();
		var consentService = new AiConsentService(consentStore, new AiConsentPolicy(POLICY_VERSION), clock);
		var authorizer = new AiOperationAuthorizer(new WorkspaceAccess() {
			@Override
			public void requireOwned(UUID userId, UUID workspaceId) {
				if (!USER_ID.equals(userId) || !WORKSPACE_ID.equals(workspaceId)) {
					throw new IllegalStateException("unexpected Workspace authorization");
				}
			}

			@Override
			public void requireEditable(UUID userId, UUID workspaceId) {
			}
		}, consentService);
		var properties = new AiProviderProperties(
				"https://openrouter.ai/api/v1", "sk-or-test", "copilot-model", "review-model",
				java.time.Duration.ofSeconds(30), 4096, new BigDecimal("0.10"), POLICY_VERSION);
		var operationService = new AiOperationService(
				authorizer, new AiProviderBoundary(properties), provider, operationStore,
				new AiOperationAuditService(operationStore), clock);
		return new ServiceFixture(operationService, consentService);
	}

	private void grantConsent(AiConsentService consentService) {
		consentService.grant(USER_ID, POLICY_VERSION);
	}

	private record ServiceFixture(AiOperationService operationService, AiConsentService consentService) {
	}

	private static final class StubProvider implements AiProviderPort {
		private final AiProviderResponse response;
		private RuntimeException failure;
		private int invocations;

		private StubProvider(AiProviderResponse response) {
			this.response = response;
		}

		@Override
		public AiProviderResponse invoke(AiProviderRequest request) {
			invocations++;
			if (failure != null) {
				throw failure;
			}
			return response;
		}
	}

	private static final class InMemoryOperationStore implements AiOperationStore {
		private final List<AiOperation> operations = new ArrayList<>();
		private BigDecimal chargedToday = BigDecimal.ZERO;

		@Override
		public BigDecimal chargedCostSince(Instant since) {
			return chargedToday;
		}

		@Override
		public void requireDailyBudgetAvailable(Instant startedAt, BigDecimal estimatedCostUsd, AiBudgetPolicy policy) {
			policy.requireAvailable(chargedToday, estimatedCostUsd);
			chargedToday = chargedToday.add(estimatedCostUsd);
		}

		@Override
		public java.util.Optional<AiOperation> findById(UUID id) {
			return operations.stream().filter(operation -> operation.id().equals(id)).findFirst();
		}

		@Override
		public AiOperation save(AiOperation operation) {
			operations.add(operation);
			return operation;
		}
	}

	private static final class InMemoryConsentStore implements AiConsentStore {
		private AiConsent consent;

		@Override
		public java.util.Optional<AiConsent> findByUserId(UUID userId) {
			return java.util.Optional.ofNullable(consent);
		}

		@Override
		public AiConsent save(AiConsent consent) {
			this.consent = consent;
			return consent;
		}
	}
}
