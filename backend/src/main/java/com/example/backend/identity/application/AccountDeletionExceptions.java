package com.example.backend.identity.application;

public final class AccountDeletionExceptions {
	private AccountDeletionExceptions() { }
	public static class AccountDeletionNotFoundException extends RuntimeException { }
	public static class RecentAuthenticationRequiredException extends RuntimeException { }
	public static class AccountSuspendedException extends RuntimeException { }
}
