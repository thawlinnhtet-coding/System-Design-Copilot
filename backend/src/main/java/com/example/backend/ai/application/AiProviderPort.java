package com.example.backend.ai.application;

public interface AiProviderPort {

	AiProviderResponse invoke(AiProviderRequest request);
}
