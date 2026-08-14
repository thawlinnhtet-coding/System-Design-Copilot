package com.example.backend.ai.application;

import java.time.Instant;
import java.util.UUID;

public record AiConsent(UUID userId, boolean granted, String policyVersion, Instant changedAt) {
}
