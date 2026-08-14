package com.example.backend.entitlement.application;

public class EntitlementRequiredException extends RuntimeException {
	private final String entitlement;

	public EntitlementRequiredException(String entitlement) {
		super("The current plan does not include this capability");
		this.entitlement = entitlement;
	}

	public String entitlement() {
		return entitlement;
	}
}
