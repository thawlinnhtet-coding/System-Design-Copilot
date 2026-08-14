package com.example.backend.ai.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Service
public class AiConsentService {

	private final AiConsentStore consentStore;
	private final AiConsentPolicy policy;
	private final Clock clock;

	public AiConsentService(AiConsentStore consentStore, AiConsentPolicy policy, Clock clock) {
		this.consentStore = consentStore;
		this.policy = policy;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public AiConsent current(UUID userId) {
		return consentStore.findByUserId(userId)
				.orElse(new AiConsent(userId, false, policy.version(), null));
	}

	@Transactional
	public AiConsent grant(UUID userId, String policyVersion) {
		if (!policy.accepts(policyVersion)) {
			throw new AiConsentExceptions.UnsupportedConsentPolicyException();
		}
		return consentStore.save(new AiConsent(userId, true, policy.version(), Instant.now(clock)));
	}

	@Transactional
	public AiConsent withdraw(UUID userId) {
		return consentStore.save(new AiConsent(userId, false, policy.version(), Instant.now(clock)));
	}

	@Transactional(readOnly = true)
	public void requireCurrent(UUID userId) {
		var consent = current(userId);
		if (!consent.granted() || !policy.accepts(consent.policyVersion())) {
			throw new AiConsentExceptions.AiConsentRequiredException();
		}
	}

	public AiConsentPolicy policy() {
		return policy;
	}
}
