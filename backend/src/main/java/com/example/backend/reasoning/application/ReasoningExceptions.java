package com.example.backend.reasoning.application;

public final class ReasoningExceptions {

	private ReasoningExceptions() {
	}

	public static class InvalidReasoningException extends RuntimeException {
		public InvalidReasoningException(String message) {
			super(message);
		}
	}
}
