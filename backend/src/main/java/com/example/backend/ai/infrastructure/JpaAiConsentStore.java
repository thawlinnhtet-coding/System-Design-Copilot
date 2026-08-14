package com.example.backend.ai.infrastructure;

import com.example.backend.ai.application.AiConsent;
import com.example.backend.ai.application.AiConsentStore;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
class JpaAiConsentStore implements AiConsentStore {

	private final AiConsentRepository repository;

	JpaAiConsentStore(AiConsentRepository repository) {
		this.repository = repository;
	}

	@Override
	public Optional<AiConsent> findByUserId(UUID userId) {
		return repository.findById(userId).map(AiConsentEntity::toConsent);
	}

	@Override
	public AiConsent save(AiConsent consent) {
		return repository.save(new AiConsentEntity(consent)).toConsent();
	}
}
