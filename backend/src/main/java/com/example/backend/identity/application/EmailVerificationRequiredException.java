package com.example.backend.identity.application;

public class EmailVerificationRequiredException extends RuntimeException {
	public EmailVerificationRequiredException() {
		super("Verify ownership of your email address with Clerk before using AI features or changing billing.");
	}
}
