package com.example.backend.ai.application;

public record ProviderRoutingPolicy(String dataCollection, boolean allowFallbacks) {

	public static final ProviderRoutingPolicy NON_RETAINING = new ProviderRoutingPolicy("deny", false);
}
