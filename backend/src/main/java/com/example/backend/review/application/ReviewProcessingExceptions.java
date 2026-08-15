package com.example.backend.review.application;

public final class ReviewProcessingExceptions {
	private ReviewProcessingExceptions() { }
	public static class InvalidIdempotencyKeyException extends RuntimeException { public InvalidIdempotencyKeyException() { super("Idempotency-Key must be present and at most 255 characters"); } }
	public static class IdempotencyConflictException extends RuntimeException { public IdempotencyConflictException() { super("Idempotency-Key was already used for a different Review request"); } }
	public static class InvalidReviewOutputException extends RuntimeException { public InvalidReviewOutputException(String message) { super(message); } }
}
