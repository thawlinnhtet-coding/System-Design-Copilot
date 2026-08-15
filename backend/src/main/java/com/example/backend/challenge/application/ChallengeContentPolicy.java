package com.example.backend.challenge.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class ChallengeContentPolicy {

	private static final Set<String> SKILLS = Set.of(
			"requirements and estimation",
			"decomposition and APIs",
			"data modeling and consistency",
			"scaling and performance",
			"async and distributed communication",
			"reliability and failure handling",
			"security and privacy",
			"operations and observability",
			"trade-off communication"
	);
	private static final Set<String> LEVELS = Set.of("introduce", "practice", "demonstrate");
	private static final Set<String> QUALITY_DIMENSIONS = Set.of(
			"learningAlignment",
			"realismAndIntentionalAmbiguity",
			"constraintsAndSolvability",
			"difficultyAndTimeCalibration",
			"scenarioQuality",
			"reviewEvaluability",
			"claritySafetyAndAccessibility"
	);

	private final ObjectMapper objectMapper = new ObjectMapper();

	public void validatePublished(String skillCoverage, String qualityScores, String independentReviewer) {
		var skills = readSkills(skillCoverage);
		if (skills.isEmpty() || skills.size() > 4 || skills.stream().filter(SkillCoverage::primary).count() != 1
				|| skills.stream().anyMatch(skill -> !SKILLS.contains(skill.name()) || !LEVELS.contains(skill.level()))) {
			throw new InvalidPublishedChallengeContentException();
		}

		var quality = readQuality(qualityScores);
		if (independentReviewer == null || independentReviewer.isBlank()
				|| !quality.keySet().equals(QUALITY_DIMENSIONS)
				|| quality.values().stream().anyMatch(score -> score < 3 || score > 5)
				|| quality.values().stream().mapToInt(Integer::intValue).average().orElse(0) < 4) {
			throw new InvalidPublishedChallengeContentException();
		}
	}

	private List<SkillCoverage> readSkills(String value) {
		try {
			var node = objectMapper.readTree(value);
			return objectMapper.readValue(node.isTextual() ? node.asText() : node.toString(), new TypeReference<>() { });
		} catch (Exception exception) {
			throw new InvalidPublishedChallengeContentException();
		}
	}

	private Map<String, Integer> readQuality(String value) {
		try {
			JsonNode node = objectMapper.readTree(value);
			if (node.isTextual()) node = objectMapper.readTree(node.asText());
			if (!node.isObject()) throw new InvalidPublishedChallengeContentException();
			var result = objectMapper.convertValue(node, new TypeReference<Map<String, Integer>>() { });
			if (result.values().stream().anyMatch(score -> score == null)) throw new InvalidPublishedChallengeContentException();
			return result;
		} catch (InvalidPublishedChallengeContentException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new InvalidPublishedChallengeContentException();
		}
	}

	public record SkillCoverage(String name, String level, boolean primary, String reviewDimension) { }

	public static class InvalidPublishedChallengeContentException extends RuntimeException {
		public InvalidPublishedChallengeContentException() {
			super("Published Challenge content does not satisfy the required skill coverage and quality gate");
		}
	}
}
