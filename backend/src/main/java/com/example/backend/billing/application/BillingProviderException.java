package com.example.backend.billing.application;

public class BillingProviderException extends RuntimeException {

	public BillingProviderException() {
		super("Stripe is unavailable");
	}
}
