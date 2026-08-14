package com.example.backend.ai.application;

public final class AiProviderExceptions {

	private AiProviderExceptions() {
	}

	public static class UnavailableException extends RuntimeException {
		protected UnavailableException(String message) {
			super(message);
		}

		public UnavailableException() {
			super("The configured privacy-preserving AI provider is temporarily unavailable");
		}

		public UnavailableException(Throwable cause) {
			super("The configured privacy-preserving AI provider is temporarily unavailable", cause);
		}
	}

	public static class NoEligibleProviderException extends UnavailableException {
		public NoEligibleProviderException() {
			super("No provider currently satisfies the privacy-preserving AI routing policy");
		}
	}

	public static class DailyBudgetExceededException extends RuntimeException {
		public DailyBudgetExceededException() {
			super("The personal-beta AI daily budget has been reached; AI operations resume at the next UTC day");
		}
	}
}
