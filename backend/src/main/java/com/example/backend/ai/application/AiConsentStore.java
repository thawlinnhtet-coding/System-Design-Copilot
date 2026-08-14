package com.example.backend.ai.application;

import java.util.Optional;
import java.util.UUID;

public interface AiConsentStore {

	Optional<AiConsent> findByUserId(UUID userId);

	AiConsent save(AiConsent consent);
}
