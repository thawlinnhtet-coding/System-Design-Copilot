package com.example.backend.challenge.application;

import com.example.backend.challenge.infrastructure.ChallengeRepository;
import com.example.backend.challenge.infrastructure.ChallengeStatus;
import com.example.backend.challenge.infrastructure.ChallengeVersionEntity;
import com.example.backend.challenge.infrastructure.ChallengeVersionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.UUID;

@Service
public class ChallengeContentOperationsService {
	private final ChallengeRepository challengeRepository;
	private final ChallengeVersionRepository versionRepository;
	private final ChallengeContentPolicy contentPolicy;
	private final ChallengeContentOperationsProperties properties;
	private final Clock clock;

	public ChallengeContentOperationsService(ChallengeRepository challengeRepository, ChallengeVersionRepository versionRepository, ChallengeContentPolicy contentPolicy, ChallengeContentOperationsProperties properties, Clock clock) {
		this.challengeRepository = challengeRepository;
		this.versionRepository = versionRepository;
		this.contentPolicy = contentPolicy;
		this.properties = properties;
		this.clock = clock;
	}

	@Transactional
	public ReleaseResult submitForReview(String clerkSubject, UUID versionId) {
		requireOperator(clerkSubject);
		var version = versionRepository.findById(versionId).orElseThrow(ChallengeExceptions.ChallengeNotFoundException::new);
		requireStatus(version.getStatus(), ChallengeStatus.DRAFT);
		version.setStatus(ChallengeStatus.REVIEW);
		return result(version);
	}

	@Transactional
	public ReleaseResult publish(String clerkSubject, UUID versionId) {
		requireOperator(clerkSubject);
		var version = versionRepository.findById(versionId).orElseThrow(ChallengeExceptions.ChallengeNotFoundException::new);
		requireStatus(version.getStatus(), ChallengeStatus.REVIEW);
		contentPolicy.validatePublished(version.getSkillCoverage(), version.getQualityScores(), version.getIndependentReviewer());
		version.setStatus(ChallengeStatus.PUBLISHED);
		version.publishAt(clock.instant());
		challengeRepository.findById(version.getChallengeId()).orElseThrow(ChallengeExceptions.ChallengeNotFoundException::new).setStatus(ChallengeStatus.PUBLISHED);
		return result(version);
	}

	@Transactional
	public ReleaseResult retire(String clerkSubject, UUID versionId) {
		requireOperator(clerkSubject);
		var version = versionRepository.findById(versionId).orElseThrow(ChallengeExceptions.ChallengeNotFoundException::new);
		requireStatus(version.getStatus(), ChallengeStatus.PUBLISHED);
		version.setStatus(ChallengeStatus.RETIRED);
		var challenge = challengeRepository.findById(version.getChallengeId()).orElseThrow(ChallengeExceptions.ChallengeNotFoundException::new);
		if (!versionRepository.existsByChallengeIdAndStatus(version.getChallengeId(), ChallengeStatus.PUBLISHED)) challenge.setStatus(ChallengeStatus.RETIRED);
		return result(version);
	}

	private void requireOperator(String clerkSubject) {
		if (!properties.isAuthorized(clerkSubject)) throw new ChallengeContentOperatorForbiddenException();
	}

	private void requireStatus(ChallengeStatus actual, ChallengeStatus expected) {
		if (actual != expected) throw new InvalidChallengeContentLifecycleException(expected, actual);
	}

	private ReleaseResult result(ChallengeVersionEntity version) { return new ReleaseResult(version.getId(), version.getChallengeId(), version.getStatus().name()); }
	public record ReleaseResult(UUID versionId, UUID challengeId, String status) { }
	public static class ChallengeContentOperatorForbiddenException extends RuntimeException { public ChallengeContentOperatorForbiddenException() { super("Only an authorized content operator can release Challenge content"); } }
	public static class InvalidChallengeContentLifecycleException extends RuntimeException { public InvalidChallengeContentLifecycleException(ChallengeStatus expected, ChallengeStatus actual) { super("Challenge Version must be " + expected + " before this release action; current status is " + actual); } }
}
