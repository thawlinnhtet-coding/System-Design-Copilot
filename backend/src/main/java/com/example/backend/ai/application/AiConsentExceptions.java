package com.example.backend.ai.application;

public final class AiConsentExceptions {

	private AiConsentExceptions() {
	}

	public static class AiConsentRequiredException extends RuntimeException {
		public AiConsentRequiredException() {
			super("AI Processing Consent is required before private Workspace context can be processed");
		}
	}

	public static class UnsupportedConsentPolicyException extends RuntimeException {
		public UnsupportedConsentPolicyException() {
			super("The AI Processing Consent policy version is no longer supported");
		}
	}
}
