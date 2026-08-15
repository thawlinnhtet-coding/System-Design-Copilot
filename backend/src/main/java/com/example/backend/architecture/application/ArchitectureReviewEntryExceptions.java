package com.example.backend.architecture.application;

public final class ArchitectureReviewEntryExceptions {

	private ArchitectureReviewEntryExceptions() {
	}

	public static class IdempotencyConflictException extends RuntimeException {
		public IdempotencyConflictException() {
			super("Idempotency-Key was already used with different Review Workspace input");
		}
	}

	public static class InvalidIdempotencyKeyException extends RuntimeException {
		public InvalidIdempotencyKeyException() {
			super("Idempotency-Key must be present and at most 255 characters");
		}
	}
}
