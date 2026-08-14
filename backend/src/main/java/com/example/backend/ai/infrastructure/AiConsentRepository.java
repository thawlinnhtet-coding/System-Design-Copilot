package com.example.backend.ai.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

interface AiConsentRepository extends JpaRepository<AiConsentEntity, UUID> {
}
