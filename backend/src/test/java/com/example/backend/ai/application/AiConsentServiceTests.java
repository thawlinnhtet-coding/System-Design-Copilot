package com.example.backend.ai.application;

import org.junit.jupiter.api.Test;
import com.example.backend.workspace.application.WorkspaceExceptions;
import com.example.backend.workspace.application.WorkspaceAccess;

import java.time.Instant;
import java.time.Clock;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiConsentServiceTests {

	private static final String POLICY_VERSION = "2026-08-01";

	@Test
	void grantsAndReturnsCurrentConsentWithThePresentedPolicyVersion() {
		var store = new InMemoryConsentStore();
		var userId = UUID.randomUUID();
		var service = service(store);

		var consent = service.grant(userId, POLICY_VERSION);

		assertTrue(consent.granted());
		assertEquals(POLICY_VERSION, consent.policyVersion());
		assertTrue(service.current(userId).granted());
		assertTrue(store.consentByUser.containsKey(userId));
	}

	@Test
	void withdrawalImmediatelyBlocksFutureAiOperationsButPreservesTheRecord() {
		var store = new InMemoryConsentStore();
		var userId = UUID.randomUUID();
		var service = service(store);
		service.grant(userId, POLICY_VERSION);

		var withdrawn = service.withdraw(userId);

		assertFalse(withdrawn.granted());
		assertEquals(POLICY_VERSION, withdrawn.policyVersion());
		assertThrows(AiConsentExceptions.AiConsentRequiredException.class, () -> service.requireCurrent(userId));
		assertTrue(store.consentByUser.containsKey(userId));
	}

	@Test
	void missingConsentIsRejectedBeforeAnAiOperationCanProceed() {
		var service = service(new InMemoryConsentStore());

		assertThrows(AiConsentExceptions.AiConsentRequiredException.class,
				() -> service.requireCurrent(UUID.randomUUID()));
	}

	@Test
	void rejectsConsentForAnOldOrMalformedPolicyVersion() {
		var service = service(new InMemoryConsentStore());

		assertThrows(AiConsentExceptions.UnsupportedConsentPolicyException.class,
				() -> service.grant(UUID.randomUUID(), " "));
		assertThrows(AiConsentExceptions.UnsupportedConsentPolicyException.class,
				() -> service.grant(UUID.randomUUID(), "2025-01-01"));
	}

	@Test
	void workspaceAuthorizationRejectsAnotherUsersWorkspaceBeforeConsentIsRead() {
		var userId = UUID.randomUUID();
		var workspaceId = UUID.randomUUID();
		var service = service(new InMemoryConsentStore());
		var workspaceAccess = new WorkspaceAccess() {
			@Override
			public void requireOwned(UUID requestedUserId, UUID requestedWorkspaceId) {
				throw new WorkspaceExceptions.WorkspaceNotFoundException();
			}

			@Override
			public void requireEditable(UUID requestedUserId, UUID requestedWorkspaceId) {
				throw new WorkspaceExceptions.WorkspaceNotFoundException();
			}
		};
		var authorizer = new AiOperationAuthorizer(workspaceAccess, service);

		assertThrows(WorkspaceExceptions.WorkspaceNotFoundException.class,
				() -> authorizer.requireAuthorized(userId, workspaceId));
	}

	private AiConsentService service(InMemoryConsentStore store) {
		return new AiConsentService(store, new AiConsentPolicy(POLICY_VERSION), Clock.systemUTC());
	}

	private static final class InMemoryConsentStore implements AiConsentStore {
		private final Map<UUID, AiConsent> consentByUser = new HashMap<>();

		@Override
		public Optional<AiConsent> findByUserId(UUID userId) {
			return Optional.ofNullable(consentByUser.get(userId));
		}

		@Override
		public AiConsent save(AiConsent consent) {
			consentByUser.put(consent.userId(), consent);
			return consent;
		}
	}
}
