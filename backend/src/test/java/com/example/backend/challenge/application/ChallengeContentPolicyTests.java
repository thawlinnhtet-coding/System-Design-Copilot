package com.example.backend.challenge.application;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ChallengeContentPolicyTests {

	private final ChallengeContentPolicy policy = new ChallengeContentPolicy();

	@Test
	void acceptsTheNineSkillTaxonomyAndAnIndependentlyReviewedQualityGate() {
		assertThatCode(() -> policy.validatePublished(
				"[{\"name\":\"decomposition and APIs\",\"level\":\"demonstrate\",\"primary\":true,\"reviewDimension\":\"architecture\"},{\"name\":\"data modeling and consistency\",\"level\":\"practice\",\"primary\":false,\"reviewDimension\":\"consistency\"},{\"name\":\"scaling and performance\",\"level\":\"practice\",\"primary\":false,\"reviewDimension\":\"scaling\"},{\"name\":\"security and privacy\",\"level\":\"introduce\",\"primary\":false,\"reviewDimension\":\"security\"}]",
				"{\"learningAlignment\":5,\"realismAndIntentionalAmbiguity\":4,\"constraintsAndSolvability\":4,\"difficultyAndTimeCalibration\":4,\"scenarioQuality\":4,\"reviewEvaluability\":4,\"claritySafetyAndAccessibility\":4}",
				"content-reviewer-1"));
	}

	@Test
	void rejectsCoverageOutsideTheNineSkillTaxonomy() {
		assertThatThrownBy(() -> policy.validatePublished(
				"[{\"name\":\"request shaping\",\"level\":\"practice\",\"primary\":true,\"reviewDimension\":\"architecture\"}]",
				validQuality(), "content-reviewer-1"))
				.isInstanceOf(ChallengeContentPolicy.InvalidPublishedChallengeContentException.class);
	}

	@Test
	void rejectsPublicationWithoutIndependentReviewOrAQualityThreshold() {
		assertThatThrownBy(() -> policy.validatePublished(
				validCoverage(), "{\"learningAlignment\":2,\"realismAndIntentionalAmbiguity\":4,\"constraintsAndSolvability\":4,\"difficultyAndTimeCalibration\":4,\"scenarioQuality\":4,\"reviewEvaluability\":4,\"claritySafetyAndAccessibility\":4}", ""))
				.isInstanceOf(ChallengeContentPolicy.InvalidPublishedChallengeContentException.class);
	}

	private String validCoverage() {
		return "[{\"name\":\"decomposition and APIs\",\"level\":\"practice\",\"primary\":true,\"reviewDimension\":\"architecture\"},{\"name\":\"data modeling and consistency\",\"level\":\"practice\",\"primary\":false,\"reviewDimension\":\"consistency\"}]";
	}

	private String validQuality() {
		return "{\"learningAlignment\":4,\"realismAndIntentionalAmbiguity\":4,\"constraintsAndSolvability\":4,\"difficultyAndTimeCalibration\":4,\"scenarioQuality\":4,\"reviewEvaluability\":4,\"claritySafetyAndAccessibility\":4}";
	}
}
