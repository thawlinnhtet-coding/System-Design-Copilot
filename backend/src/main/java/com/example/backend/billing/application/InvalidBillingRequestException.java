package com.example.backend.billing.application;

public class InvalidBillingRequestException extends RuntimeException {

	public InvalidBillingRequestException() {
		super("Idempotency-Key must be present and at most 255 characters");
	}
}
