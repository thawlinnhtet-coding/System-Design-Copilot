package com.example.backend.progress.application;

import com.example.backend.review.application.ReviewStatus;
import com.example.backend.review.infrastructure.ReviewRepository;
import com.example.backend.review.infrastructure.ReviewRequestEntity;
import com.example.backend.review.infrastructure.ReviewRequestRepository;
import com.example.backend.scenario.infrastructure.ScenarioRepository;
import com.example.backend.scenario.infrastructure.ScenarioStatus;
import com.example.backend.workspace.infrastructure.WorkspaceEntity;
import com.example.backend.workspace.infrastructure.WorkspaceRepository;
import com.example.backend.workspace.infrastructure.WorkspaceStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Read-only, ownership-scoped practice history. Review score changes are exposed only as
 * same-Workspace, same-dimension comparisons; this service deliberately makes no learning claim.
 */
@Service
public class ProgressService {
	private static final int RECENT_ACTIVITY_LIMIT = 12;
	private final WorkspaceRepository workspaces;
	private final ScenarioRepository scenarios;
	private final ReviewRequestRepository reviewRequests;
	private final ReviewRepository reviews;
	private final ObjectMapper objectMapper;

	public ProgressService(WorkspaceRepository workspaces, ScenarioRepository scenarios, ReviewRequestRepository reviewRequests, ReviewRepository reviews, ObjectMapper objectMapper) {
		this.workspaces = workspaces;
		this.scenarios = scenarios;
		this.reviewRequests = reviewRequests;
		this.reviews = reviews;
		this.objectMapper = objectMapper;
	}

	@Transactional(readOnly = true)
	public ProgressOverview overview(UUID userId) {
		var ownedWorkspaces = workspaces.findAllByUserIdOrderByUpdatedAtDesc(userId);
		var workspaceNames = new HashMap<UUID, String>();
		for (var workspace : ownedWorkspaces) workspaceNames.put(workspace.getId(), workspace.getName());

		var completedScenarios = scenarios.findAllByUserIdAndStatusOrderByCompletedAtDesc(userId, ScenarioStatus.COMPLETED);
		var completedReviews = reviewRequests.findByUserIdAndStatusOrderByCompletedAtDesc(userId, ReviewStatus.COMPLETED);

		return new ProgressOverview(
				new PracticeVolume(
						ownedWorkspaces.size(),
						(int) ownedWorkspaces.stream().filter(workspace -> workspace.getStatus() == WorkspaceStatus.ACTIVE).count(),
						completedScenarios.size(),
						completedReviews.size()
				),
				recentActivity(ownedWorkspaces, completedScenarios, completedReviews, workspaceNames),
				qualifiedTrends(completedReviews, workspaceNames)
		);
	}

	private List<Activity> recentActivity(List<WorkspaceEntity> ownedWorkspaces, List<com.example.backend.scenario.infrastructure.ScenarioEntity> completedScenarios, List<ReviewRequestEntity> completedReviews, Map<UUID, String> workspaceNames) {
		var activity = new ArrayList<Activity>();
		for (var workspace : ownedWorkspaces) activity.add(new Activity("WORKSPACE_UPDATED", workspace.getId(), workspace.getName(), workspace.getUpdatedAt()));
		for (var scenario : completedScenarios) activity.add(new Activity("SCENARIO_COMPLETED", scenario.getWorkspaceId(), workspaceNames.get(scenario.getWorkspaceId()), scenario.getCompletedAt()));
		for (var review : completedReviews) activity.add(new Activity("REVIEW_COMPLETED", review.getWorkspaceId(), workspaceNames.get(review.getWorkspaceId()), review.getCompletedAt()));
		return activity.stream().filter(item -> item.occurredAt() != null).sorted(Comparator.comparing(Activity::occurredAt).reversed()).limit(RECENT_ACTIVITY_LIMIT).toList();
	}

	private List<ReviewDimensionTrend> qualifiedTrends(List<ReviewRequestEntity> completedReviews, Map<UUID, String> workspaceNames) {
		var byWorkspace = new HashMap<UUID, List<ReviewRequestEntity>>();
		for (var review : completedReviews) byWorkspace.computeIfAbsent(review.getWorkspaceId(), ignored -> new ArrayList<>()).add(review);
		var trends = new ArrayList<ReviewDimensionTrend>();
		for (var entry : byWorkspace.entrySet()) {
			var history = entry.getValue();
			if (history.size() < 2) continue;
			history.sort(Comparator.comparing(ReviewRequestEntity::getCompletedAt));
			var baseline = history.get(history.size() - 2);
			var comparison = history.get(history.size() - 1);
			if (baseline.getRevisionId().equals(comparison.getRevisionId())) continue;
			var baselineScores = scoresFor(baseline.getId());
			var comparisonScores = scoresFor(comparison.getId());
			for (var score : comparisonScores.entrySet()) {
				var previous = baselineScores.get(score.getKey());
				if (previous == null) continue;
				trends.add(new ReviewDimensionTrend(entry.getKey(), workspaceNames.get(entry.getKey()), score.getKey(), previous, score.getValue(), score.getValue() - previous, baseline.getId(), comparison.getId(), baseline.getCompletedAt(), comparison.getCompletedAt()));
			}
		}
		return trends.stream().sorted(Comparator.comparing(ReviewDimensionTrend::comparisonCompletedAt).reversed()).toList();
	}

	private Map<String, Integer> scoresFor(UUID reviewRequestId) {
		var review = reviews.findByReviewRequestId(reviewRequestId).orElse(null);
		if (review == null) return Map.of();
		try {
			var scores = objectMapper.readTree(review.getOutput()).path("scores");
			if (!scores.isObject()) return Map.of();
			var result = new HashMap<String, Integer>();
			for (var field : scores.properties()) {
				JsonNode value = field.getValue();
				if (value.isInt() && value.asInt() >= 1 && value.asInt() <= 5) result.put(field.getKey(), value.asInt());
			}
			return result;
		} catch (RuntimeException exception) {
			return Map.of();
		}
	}

	public record ProgressOverview(PracticeVolume practiceVolume, List<Activity> recentActivity, List<ReviewDimensionTrend> qualifiedReviewTrends) { }
	public record PracticeVolume(int ownedWorkspaceCount, int activeWorkspaceCount, int completedScenarioCount, int completedReviewCount) { }
	public record Activity(String type, UUID workspaceId, String workspaceName, Instant occurredAt) { }
	public record ReviewDimensionTrend(UUID workspaceId, String workspaceName, String dimension, int baselineScore, int comparisonScore, int change, UUID baselineReviewRequestId, UUID comparisonReviewRequestId, Instant baselineCompletedAt, Instant comparisonCompletedAt) { }
}
