package com.example.backend.challenge.application;

public final class ChallengeExceptions {
	private ChallengeExceptions() { }
	public static class ChallengeNotFoundException extends RuntimeException {
		public ChallengeNotFoundException() { super("The Challenge does not exist or is not published"); }
	}
}
