package com.example.backend.challenge.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ChallengeVersionRepository extends JpaRepository<ChallengeVersionEntity, UUID> {
	Optional<ChallengeVersionEntity> findTopByChallengeIdAndStatusOrderByVersionDesc(UUID challengeId, ChallengeStatus status);
}
