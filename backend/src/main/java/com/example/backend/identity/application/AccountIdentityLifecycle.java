package com.example.backend.identity.application;

/** Backend-only managed-identity operations. Browser code never receives a Clerk secret. */
public interface AccountIdentityLifecycle {
	void revokeAllSessions(String clerkSubject);
	void deleteUser(String clerkSubject);
}
