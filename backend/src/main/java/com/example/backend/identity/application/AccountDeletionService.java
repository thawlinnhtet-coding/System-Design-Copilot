package com.example.backend.identity.application;

import com.example.backend.billing.application.BillingService;
import com.example.backend.identity.application.AccountDeletionExceptions.AccountDeletionNotFoundException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

/** Owns the reversible account-deletion lifecycle. Product data is only removed after recovery ends. */
@Service
public class AccountDeletionService {

	private static final long RECOVERY_SECONDS = 7 * 24 * 60 * 60L;
	private final AccountDeletionStore store;
	private final CurrentUserStore users;
	private final AccountIdentityLifecycle identityLifecycle;
	private final AccountDeletionNotifier notifier;
	private final BillingService billingService;
	private final Clock clock;
	private final SecureRandom secureRandom = new SecureRandom();

	public AccountDeletionService(AccountDeletionStore store, CurrentUserStore users, AccountIdentityLifecycle identityLifecycle,
			AccountDeletionNotifier notifier, BillingService billingService, Clock clock) {
		this.store = store;
		this.users = users;
		this.identityLifecycle = identityLifecycle;
		this.notifier = notifier;
		this.billingService = billingService;
		this.clock = clock;
	}

	@Transactional
	public DeletionStatus request(CurrentUserService.CurrentUser user, String verifiedEmail) {
		var existing = store.findByUserId(user.id());
		if (existing.isPresent()) return status(existing.get());
		var now = Instant.now(clock);
		var rawToken = cancellationToken();
		var request = new AccountDeletionStore.Request(user.id(), hash(rawToken), now, now.plusSeconds(RECOVERY_SECONDS));
		// Revoke sessions before suspension so a stolen existing session cannot keep operating.
		identityLifecycle.revokeAllSessions(user.clerkSubject());
		billingService.cancelSubscriptionRenewal(user);
		users.suspend(user.id());
		store.save(request);
		notifier.sendCancellationLink(verifiedEmail, rawToken, request.recoveryEndsAt());
		return status(request);
	}

	@Transactional(readOnly = true)
	public DeletionStatus status(UUID userId) {
		return store.findByUserId(userId).map(this::status).orElse(DeletionStatus.none());
	}

	@Transactional
	public void cancel(String clerkSubject, String rawToken) {
		var user = users.findByClerkSubject(clerkSubject).orElseThrow(AccountDeletionNotFoundException::new);
		var request = store.findByUserId(user.id()).orElseThrow(AccountDeletionNotFoundException::new);
		var now = Instant.now(clock);
		if (!now.isBefore(request.recoveryEndsAt()) || !MessageDigest.isEqual(request.cancellationTokenHash(), hash(rawToken))) {
			throw new AccountDeletionNotFoundException();
		}
		store.delete(request.userId());
		users.restore(user.id());
	}

	@Scheduled(fixedDelayString = "${app.account-deletion.cleanup-interval-ms:60000}")
	@Transactional
	public void deleteExpiredAccounts() {
		for (var request : store.findExpired(Instant.now(clock))) {
			var user = users.findByIdIncludingSuspended(request.userId());
			if (user.isEmpty()) {
				store.delete(request.userId());
				continue;
			}
			identityLifecycle.deleteUser(user.get().clerkSubject());
			store.recordTombstone(request.userId(), Instant.now(clock));
			users.delete(user.get().id());
		}
	}

	private DeletionStatus status(AccountDeletionStore.Request request) {
		return new DeletionStatus(true, request.requestedAt(), request.recoveryEndsAt());
	}

	private String cancellationToken() {
		var bytes = new byte[32];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private byte[] hash(String token) {
		try {
			return MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
		} catch (Exception exception) {
			throw new IllegalStateException("SHA-256 is unavailable", exception);
		}
	}

	public record DeletionStatus(boolean scheduled, Instant requestedAt, Instant recoveryEndsAt) {
		static DeletionStatus none() { return new DeletionStatus(false, null, null); }
	}
}
