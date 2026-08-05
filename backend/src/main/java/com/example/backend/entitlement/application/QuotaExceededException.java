package com.example.backend.entitlement.application;

public class QuotaExceededException extends RuntimeException {

	private final String allowance;

	public QuotaExceededException(String allowance) {
		super("The " + allowance + " allowance has been reached");
		this.allowance = allowance;
	}

	public String allowance() {
		return allowance;
	}

}
