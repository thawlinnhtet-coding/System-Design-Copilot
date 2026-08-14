package com.example.backend.challenge.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChallengeRepository extends JpaRepository<ChallengeEntity, UUID> {
	List<ChallengeEntity> findAllByStatusOrderByTopicAscSlugAsc(ChallengeStatus status);
	Optional<ChallengeEntity> findBySlugAndStatus(String slug, ChallengeStatus status);
}
