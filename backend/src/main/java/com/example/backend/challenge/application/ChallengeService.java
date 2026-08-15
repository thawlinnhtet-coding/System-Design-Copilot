package com.example.backend.challenge.application;

import com.example.backend.challenge.application.ChallengeExceptions.ChallengeNotFoundException;
import com.example.backend.challenge.infrastructure.ChallengeEntity;
import com.example.backend.challenge.infrastructure.ChallengeRepository;
import com.example.backend.challenge.infrastructure.ChallengeStatus;
import com.example.backend.challenge.infrastructure.ChallengeVersionEntity;
import com.example.backend.challenge.infrastructure.ChallengeVersionRepository;
import com.example.backend.entitlement.application.EntitlementService;
import com.example.backend.workspace.application.WorkspaceService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ChallengeService {
	private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() { };
	private static final TypeReference<List<SkillCoverage>> SKILL_LIST = new TypeReference<>() { };
	private final ChallengeRepository challengeRepository;
	private final ChallengeVersionRepository versionRepository;
	private final EntitlementService entitlementService;
	private final WorkspaceService workspaceService;
	private final ChallengeContentPolicy contentPolicy;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public ChallengeService(ChallengeRepository challengeRepository, ChallengeVersionRepository versionRepository, EntitlementService entitlementService, WorkspaceService workspaceService, ChallengeContentPolicy contentPolicy) {
		this.challengeRepository = challengeRepository;
		this.versionRepository = versionRepository;
		this.entitlementService = entitlementService;
		this.workspaceService = workspaceService;
		this.contentPolicy = contentPolicy;
	}

	@Transactional(readOnly = true)
	public List<ChallengeSummary> catalog() {
		return challengeRepository.findAllByStatusOrderByTopicAscSlugAsc(ChallengeStatus.PUBLISHED).stream().map(this::summary).toList();
	}

	@Transactional(readOnly = true)
	public ChallengeDetail detail(UUID userId, String slug) {
		entitlementService.requireCuratedChallengeAccess(userId);
		var version = publishedVersion(slug);
		var challenge = challengeRepository.findById(version.getChallengeId()).orElseThrow(ChallengeNotFoundException::new);
		var attempts = workspaceService.list(userId).stream()
				.filter(workspace -> version.getId().equals(workspace.challengeVersionId()))
				.map(workspace -> new ChallengeAttempt(workspace.id(), workspace.name(), workspace.status(), workspace.updatedAt()))
				.toList();
		return new ChallengeDetail(challenge.getSlug(), challenge.getTopic(), version.getId(), version.getVersion(), version.getTitle(), version.getDescription(), version.getProblemStatement(), version.getDifficulty().name(), version.getEstimatedMinutes(), readStrings(version.getTopicPacks()), readStrings(version.getInitialConstraints()), readSkills(version.getSkillCoverage()), readStrings(version.getScenarioPreview()), attempts);
	}

	@Transactional
	public WorkspaceService.WorkspaceSummary start(UUID userId, String slug) {
		entitlementService.requireCuratedChallengeAccess(userId);
		var version = publishedVersion(slug);
		return workspaceService.createChallenge(userId, version.getTitle(), version.getDescription(), version.getId(), snapshot(version));
	}

	private ChallengeSummary summary(ChallengeEntity challenge) {
		var version = versionRepository.findTopByChallengeIdAndStatusOrderByVersionDesc(challenge.getId(), ChallengeStatus.PUBLISHED).orElseThrow(ChallengeNotFoundException::new);
		validatePublished(version);
		var skillFocus = readSkills(version.getSkillCoverage()).stream().filter(SkillCoverage::primary).findFirst().map(SkillCoverage::name).orElse("General systems reasoning");
		return new ChallengeSummary(challenge.getSlug(), challenge.getTopic(), version.getId(), version.getTitle(), version.getDescription(), version.getDifficulty().name(), version.getEstimatedMinutes(), skillFocus);
	}

	private ChallengeVersionEntity publishedVersion(String slug) {
		var challenge = challengeRepository.findBySlugAndStatus(slug, ChallengeStatus.PUBLISHED).orElseThrow(ChallengeNotFoundException::new);
		var version = versionRepository.findTopByChallengeIdAndStatusOrderByVersionDesc(challenge.getId(), ChallengeStatus.PUBLISHED).orElseThrow(ChallengeNotFoundException::new);
		validatePublished(version);
		return version;
	}

	private void validatePublished(ChallengeVersionEntity version) {
		contentPolicy.validatePublished(version.getSkillCoverage(), version.getQualityScores(), version.getIndependentReviewer());
	}

	private List<String> readStrings(String value) {
		try {
			var node = objectMapper.readTree(value);
			return objectMapper.readValue(node.isTextual() ? node.asText() : node.toString(), STRING_LIST);
		}
		catch (Exception exception) { throw new IllegalStateException("Published Challenge content is invalid", exception); }
	}

	private List<SkillCoverage> readSkills(String value) {
		try {
			var node = objectMapper.readTree(value);
			return objectMapper.readValue(node.isTextual() ? node.asText() : node.toString(), SKILL_LIST);
		}
		catch (Exception exception) { throw new IllegalStateException("Published Challenge skill coverage is invalid", exception); }
	}

	public record ChallengeSummary(String slug, String topic, UUID versionId, String title, String description, String difficulty, int estimatedMinutes, String skillFocus) { }
	public record ChallengeDetail(String slug, String topic, UUID versionId, int version, String title, String description, String problemStatement, String difficulty, int estimatedMinutes, List<String> topicPacks, List<String> initialConstraints, List<SkillCoverage> skillCoverage, List<String> scenarioPreview, List<ChallengeAttempt> attempts) { }
	public record ChallengeAttempt(UUID id, String name, String status, java.time.Instant updatedAt) { }
	public record SkillCoverage(String name, String level, boolean primary, String reviewDimension) { }

	private String snapshot(ChallengeVersionEntity version) {
		try {
			var snapshot = objectMapper.createObjectNode();
			snapshot.put("versionId", version.getId().toString());
			snapshot.put("version", version.getVersion());
			snapshot.put("title", version.getTitle());
			snapshot.put("description", version.getDescription());
			snapshot.put("problemStatement", version.getProblemStatement());
			snapshot.put("difficulty", version.getDifficulty().name());
			snapshot.put("estimatedMinutes", version.getEstimatedMinutes());
			snapshot.set("topicPacks", objectMapper.readTree(readJson(version.getTopicPacks())));
			snapshot.set("initialConstraints", objectMapper.readTree(readJson(version.getInitialConstraints())));
			snapshot.set("skillCoverage", objectMapper.readTree(readJson(version.getSkillCoverage())));
			snapshot.set("scenarioPreview", objectMapper.readTree(readJson(version.getScenarioPreview())));
			snapshot.set("scenarioArc", objectMapper.readTree(readJson(version.getScenarioArc())));
			return objectMapper.writeValueAsString(snapshot);
		} catch (Exception exception) {
			throw new IllegalStateException("Published Challenge content is invalid", exception);
		}
	}

	private String readJson(String value) throws Exception {
		var node = objectMapper.readTree(value);
		return node.isTextual() ? node.asText() : node.toString();
	}
}
