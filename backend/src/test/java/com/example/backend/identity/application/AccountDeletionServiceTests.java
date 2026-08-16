package com.example.backend.identity.application;

import com.example.backend.billing.application.BillingService;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class AccountDeletionServiceTests {
	private static final Instant NOW = Instant.parse("2026-08-16T00:00:00Z");

	@Test
	void requestSuspendsAccessRevokesSessionsAndTheEmailTokenCanRestoreAccess() {
		var store = new Store(); var users = new Users(); var lifecycle = new Lifecycle(); var notifier = new Notifier();
		var user = new CurrentUserService.CurrentUser(UUID.randomUUID(), "user_123"); users.user = user;
		var service = service(store, users, lifecycle, notifier);
		var status = service.request(user, "learner@example.com");
		assertTrue(status.scheduled()); assertTrue(users.suspended); assertEquals("user_123", lifecycle.revokedSubject); assertNotNull(notifier.token);
		service.cancel("user_123", notifier.token);
		assertFalse(users.suspended); assertTrue(store.request.isEmpty());
	}

	@Test
	void recoveryExpiryDeletesTheManagedIdentityThenProductUserAndLeavesOnlyOpaqueTombstone() {
		var store = new Store(); var users = new Users(); var lifecycle = new Lifecycle();
		var user = new CurrentUserService.CurrentUser(UUID.randomUUID(), "user_123"); users.user = user;
		store.request = Optional.of(new AccountDeletionStore.Request(user.id(), new byte[32], NOW.minusSeconds(8 * 86_400), NOW.minusSeconds(1)));
		service(store, users, lifecycle, new Notifier()).deleteExpiredAccounts();
		assertEquals("user_123", lifecycle.deletedSubject); assertTrue(users.deleted); assertTrue(store.tombstoneRecorded);
	}

	private AccountDeletionService service(Store store, Users users, Lifecycle lifecycle, Notifier notifier) {
		return new AccountDeletionService(store, users, lifecycle, notifier, new BillingService() {
			public CheckoutSession startCheckout(CurrentUserService.CurrentUser user, String key) { throw new UnsupportedOperationException(); }
			public PortalSession startCustomerPortal(CurrentUserService.CurrentUser user) { throw new UnsupportedOperationException(); }
			public void cancelSubscriptionRenewal(CurrentUserService.CurrentUser user) { }
			public void reconcileCompletedCheckout(CurrentUserService.CurrentUser user, String id) { }
			public void processWebhook(byte[] body, String signature) { }
		}, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private static final class Store implements AccountDeletionStore {
		Optional<Request> request = Optional.empty(); boolean tombstoneRecorded;
		public Optional<Request> findByUserId(UUID userId) { return request.filter(value -> value.userId().equals(userId)); }
		public List<Request> findExpired(Instant now) { return request.filter(value -> !value.recoveryEndsAt().isAfter(now)).stream().toList(); }
		public void save(Request value) { request = Optional.of(value); }
		public void delete(UUID userId) { request = Optional.empty(); }
		public void recordTombstone(UUID userId, Instant deletedAt) { tombstoneRecorded = true; }
	}
	private static final class Users implements CurrentUserStore {
		CurrentUserService.CurrentUser user; boolean suspended; boolean deleted;
		public Optional<CurrentUserService.CurrentUser> findByClerkSubject(String subject) { return Optional.ofNullable(user).filter(value -> value.clerkSubject().equals(subject)); }
		public CurrentUserService.CurrentUser create(String subject) { throw new UnsupportedOperationException(); }
		public Optional<CurrentUserService.CurrentUser> findByIdIncludingSuspended(UUID id) { return Optional.ofNullable(user).filter(value -> value.id().equals(id)); }
		public boolean isSuspended(UUID id) { return suspended; }
		public void suspend(UUID id) { suspended = true; }
		public void restore(UUID id) { suspended = false; }
		public void delete(UUID id) { deleted = true; user = null; }
	}
	private static final class Lifecycle implements AccountIdentityLifecycle { String revokedSubject; String deletedSubject; public void revokeAllSessions(String subject) { revokedSubject = subject; } public void deleteUser(String subject) { deletedSubject = subject; } }
	private static final class Notifier implements AccountDeletionNotifier { String token; public void sendCancellationLink(String email, String token, Instant end) { this.token = token; } }
}
