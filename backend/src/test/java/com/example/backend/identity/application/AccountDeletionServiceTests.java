package com.example.backend.identity.application;

import com.example.backend.billing.application.BillingService;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AccountDeletionServiceTests {
	private static final Instant NOW = Instant.parse("2026-08-16T00:00:00Z");

	@Test
	void confirmationCancelsRenewalAndDeletesIdentityAndProductDataImmediately() {
		var store = new Store(); var users = new Users(); var lifecycle = new Lifecycle();
		var user = new CurrentUserService.CurrentUser(UUID.randomUUID(), "user_123"); users.user = user;

		service(store, users, lifecycle).delete(user);

		assertEquals("user_123", lifecycle.deletedSubject);
		assertTrue(users.deleted);
		assertTrue(store.tombstoneRecorded);
	}

	private AccountDeletionService service(Store store, Users users, Lifecycle lifecycle) {
		return new AccountDeletionService(store, users, lifecycle, new BillingService() {
			public CheckoutSession startCheckout(CurrentUserService.CurrentUser user, String key) { throw new UnsupportedOperationException(); }
			public PortalSession startCustomerPortal(CurrentUserService.CurrentUser user) { throw new UnsupportedOperationException(); }
			public void cancelSubscriptionRenewal(CurrentUserService.CurrentUser user) { }
			public void reconcileCompletedCheckout(CurrentUserService.CurrentUser user, String id) { }
			public void processWebhook(byte[] body, String signature) { }
		}, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private static final class Store implements AccountDeletionStore {
		boolean tombstoneRecorded;
		public void recordTombstone(UUID userId, Instant deletedAt) { tombstoneRecorded = true; }
	}

	private static final class Users implements CurrentUserStore {
		CurrentUserService.CurrentUser user; boolean deleted;
		public Optional<CurrentUserService.CurrentUser> findByClerkSubject(String subject) { return Optional.ofNullable(user).filter(value -> value.clerkSubject().equals(subject)); }
		public CurrentUserService.CurrentUser create(String subject) { throw new UnsupportedOperationException(); }
		public void delete(UUID id) { deleted = true; user = null; }
	}

	private static final class Lifecycle implements AccountIdentityLifecycle {
		String deletedSubject;
		public void deleteUser(String subject) { deletedSubject = subject; }
	}
}
