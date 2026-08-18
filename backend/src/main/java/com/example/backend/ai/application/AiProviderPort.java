package com.example.backend.ai.application;

import reactor.core.publisher.Flux;

public interface AiProviderPort {

	AiProviderResponse invoke(AiProviderRequest request);

	default Flux<AiProviderResponse> stream(AiProviderRequest request) {
		return Flux.error(new UnsupportedOperationException("Streaming is not implemented by this AI provider"));
	}
}
