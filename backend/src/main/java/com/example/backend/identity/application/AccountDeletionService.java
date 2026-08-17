package com.example.backend.identity.application;

import com.example.backend.billing.application.BillingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

/** Owns the irreversible account-deletion command after authenticated confirmation. */
@Service
public class AccountDeletionService {

	private final AccountDeletionStore store;
	private final CurrentUserStore users;
	private final AccountIdentityLifecycle identityLifecycle;
	private final BillingService billingService;
	private final Clock clock;

	public AccountDeletionService(AccountDeletionStore store, CurrentUserStore users, AccountIdentityLifecycle identityLifecycle,
			BillingService billingService, Clock clock) {
		this.store = store;
		this.users = users;
		this.identityLifecycle = identityLifecycle;
		this.billingService = billingService;
		this.clock = clock;
	}

	@Transactional
	public void delete(CurrentUserService.CurrentUser user) {
		var deletedAt = Instant.now(clock);
		billingService.cancelSubscriptionRenewal(user);
		identityLifecycle.deleteUser(user.clerkSubject());
		store.recordTombstone(user.id(), deletedAt);
		users.delete(user.id());
	}
}
