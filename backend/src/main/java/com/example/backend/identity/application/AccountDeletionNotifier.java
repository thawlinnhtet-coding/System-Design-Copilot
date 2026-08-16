package com.example.backend.identity.application;

import java.time.Instant;

/** Sends a cancellation URL only to the verified email address supplied by Clerk's signed token. */
public interface AccountDeletionNotifier {
	void sendCancellationLink(String verifiedEmail, String cancellationToken, Instant recoveryEndsAt);
}
