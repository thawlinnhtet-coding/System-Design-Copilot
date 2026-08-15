package com.example.backend.scenario.application;

import com.example.backend.ai.application.AiBoundedContext;
import com.example.backend.ai.application.AiOperationService;
import com.example.backend.ai.application.AiProfile;
import com.example.backend.scenario.infrastructure.ScenarioEntity;
import com.example.backend.scenario.infrastructure.ScenarioRepository;
import com.example.backend.scenario.infrastructure.ScenarioSource;
import com.example.backend.scenario.infrastructure.ScenarioStatus;
import com.example.backend.workspace.application.WorkspaceAccess;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ScenarioService implements ScenarioSnapshotProvider, ScenarioInitializer {
	private static final TypeReference<List<ScenarioContentPolicy.ScenarioDefinition>> CURATED_ARC = new TypeReference<>() { };
	private final WorkspaceAccess workspaceAccess;
	private final ScenarioWorkspaceContextProvider workspaceContextProvider;
	private final ScenarioRepository scenarios;
	private final ScenarioContentPolicy contentPolicy;
	private final AiOperationService aiOperationService;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final Clock clock;

	public ScenarioService(WorkspaceAccess workspaceAccess, @Lazy ScenarioWorkspaceContextProvider workspaceContextProvider, ScenarioRepository scenarios, ScenarioContentPolicy contentPolicy, AiOperationService aiOperationService, Clock clock) {
		this.workspaceAccess = workspaceAccess; this.workspaceContextProvider = workspaceContextProvider; this.scenarios = scenarios;
		this.contentPolicy = contentPolicy; this.aiOperationService = aiOperationService; this.clock = clock;
	}

	@Transactional(readOnly = true)
	public List<ScenarioResponse> list(UUID userId, UUID workspaceId) {
		workspaceAccess.requireOwned(userId, workspaceId);
		return scenarios.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAsc(workspaceId, userId).stream().map(this::response).toList();
	}

	@Transactional
	public ScenarioResponse start(UUID userId, UUID workspaceId, UUID scenarioId) {
		workspaceAccess.requireEditable(userId, workspaceId);
		var scenario = owned(userId, workspaceId, scenarioId);
		if (scenario.getStatus() != ScenarioStatus.AVAILABLE || activeScenarioExists(userId, workspaceId) || !previousScenariosCompleted(userId, workspaceId, scenario.getOrderIndex())) throw new ScenarioExceptions.ScenarioUnavailableException();
		scenario.start(now());
		return response(scenario);
	}

	@Transactional
	public ScenarioResponse saveDraft(UUID userId, UUID workspaceId, UUID scenarioId, ResponseInput input) {
		workspaceAccess.requireEditable(userId, workspaceId);
		validateResponse(input, false);
		var scenario = owned(userId, workspaceId, scenarioId);
		if (scenario.getStatus() != ScenarioStatus.REVEALED && scenario.getStatus() != ScenarioStatus.DRAFT) throw new ScenarioExceptions.ScenarioUnavailableException();
		scenario.saveDraft(trim(input.response()), nullableTrim(input.architectureChanges()), nullableTrim(input.decisionChanges()), now());
		return response(scenario);
	}

	@Transactional
	public ScenarioResponse complete(UUID userId, UUID workspaceId, UUID scenarioId, ResponseInput input) {
		workspaceAccess.requireEditable(userId, workspaceId);
		validateResponse(input, true);
		var scenario = owned(userId, workspaceId, scenarioId);
		if (scenario.getStatus() != ScenarioStatus.REVEALED && scenario.getStatus() != ScenarioStatus.DRAFT) throw new ScenarioExceptions.ScenarioUnavailableException();
		scenario.complete(trim(input.response()), nullableTrim(input.architectureChanges()), nullableTrim(input.decisionChanges()), now());
		return response(scenario);
	}

	@Transactional
	public ScenarioResponse createAiAssisted(UUID userId, UUID workspaceId) {
		workspaceAccess.requireEditable(userId, workspaceId);
		if (activeScenarioExists(userId, workspaceId)) throw new ScenarioExceptions.ScenarioUnavailableException();
		var context = workspaceContextProvider.scenarioContext(userId, workspaceId);
		var result = aiOperationService.invoke(userId, AiProfile.COPILOT, new AiBoundedContext(workspaceId, aiPrompt(context)), new BigDecimal("0.002"), "scenario-v1");
		var definition = parseAiDefinition(result.content());
		var entity = scenarios.save(new ScenarioEntity(workspaceId, userId, ScenarioSource.AI_ASSISTED, nextOrder(userId, workspaceId), definition.title(), definition.changedCondition(), definition.details(), definition.category(), now()));
		return response(entity);
	}

	@Override
	@Transactional
	public void initializeCurated(UUID userId, UUID workspaceId, String challengeSnapshot) {
		if (!scenarios.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAsc(workspaceId, userId).isEmpty()) return;
		try {
			var root = objectMapper.readTree(challengeSnapshot);
			var arc = root.path("scenarioArc");
			var definitions = objectMapper.readValue(arc.toString(), CURATED_ARC);
			if (definitions.size() != 3) throw new ScenarioExceptions.InvalidScenarioException("A curated Challenge requires exactly three Scenarios");
			for (int index = 0; index < definitions.size(); index++) {
				var item = definitions.get(index);
				var valid = contentPolicy.curated(item.title(), item.changedCondition(), item.details(), item.category());
				scenarios.save(new ScenarioEntity(workspaceId, userId, ScenarioSource.CURATED, index, valid.title(), valid.changedCondition(), valid.details(), valid.category(), now()));
			}
		} catch (ScenarioExceptions.InvalidScenarioException exception) { throw exception;
		} catch (Exception exception) { throw new ScenarioExceptions.InvalidScenarioException("The Challenge Scenario arc is invalid"); }
	}

	@Override
	@Transactional(readOnly = true)
	public String completedSnapshotForRevision(UUID userId, UUID workspaceId) {
		workspaceAccess.requireOwned(userId, workspaceId);
		try {
			var snapshot = objectMapper.createArrayNode();
			for (var scenario : scenarios.findAllByWorkspaceIdAndUserIdAndStatusOrderByOrderIndexAsc(workspaceId, userId, ScenarioStatus.COMPLETED)) {
				var item = snapshot.addObject();
				item.put("id", scenario.getId().toString()); item.put("title", scenario.getTitle()); item.put("changedCondition", scenario.getChangedCondition());
				item.put("details", scenario.getDetails()); item.put("category", scenario.getCategory()); item.put("response", scenario.getResponse());
				if (scenario.getArchitectureChanges() != null) item.put("architectureChanges", scenario.getArchitectureChanges());
				if (scenario.getDecisionChanges() != null) item.put("decisionChanges", scenario.getDecisionChanges());
				if (scenario.getCompletedAt() != null) item.put("completedAt", scenario.getCompletedAt().toString());
			}
			return objectMapper.writeValueAsString(snapshot);
		} catch (Exception exception) { throw new IllegalStateException("Could not snapshot completed Scenarios", exception); }
	}

	private ScenarioContentPolicy.ScenarioDefinition parseAiDefinition(String content) {
		try { return contentPolicy.validate(objectMapper.readTree(content)); }
		catch (ScenarioExceptions.InvalidAiScenarioException exception) { throw exception; }
		catch (Exception exception) { throw new ScenarioExceptions.InvalidAiScenarioException(); }
	}

	private String aiPrompt(ScenarioWorkspaceContextProvider.ScenarioWorkspaceContext context) {
		return "Create one advisory system-design pressure test for this private Workspace. Return JSON only with title, changedCondition, details, category. category must be one of GROWTH_SCALE, FAILURE_RELIABILITY, CONSISTENCY, SECURITY, OPERATIONS, PRODUCT_CHANGE. Do not propose a complete architecture. Workspace name: " + context.name() + ". Workspace brief: " + context.description();
	}

	private boolean activeScenarioExists(UUID userId, UUID workspaceId) {
		return scenarios.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAsc(workspaceId, userId).stream().anyMatch(value -> value.getStatus() == ScenarioStatus.REVEALED || value.getStatus() == ScenarioStatus.DRAFT);
	}
	private boolean previousScenariosCompleted(UUID userId, UUID workspaceId, int orderIndex) {
		return scenarios.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAsc(workspaceId, userId).stream()
				.filter(value -> value.getOrderIndex() < orderIndex).allMatch(value -> value.getStatus() == ScenarioStatus.COMPLETED);
	}
	private ScenarioEntity owned(UUID userId, UUID workspaceId, UUID scenarioId) { return scenarios.findByIdAndWorkspaceIdAndUserId(scenarioId, workspaceId, userId).orElseThrow(ScenarioExceptions.ScenarioNotFoundException::new); }
	private int nextOrder(UUID userId, UUID workspaceId) { return scenarios.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAsc(workspaceId, userId).size(); }
	private Instant now() { return Instant.now(clock); }
	private void validateResponse(ResponseInput input, boolean completing) {
		if (input == null || input.response() == null || input.response().isBlank() || input.response().trim().length() > 8000) throw new ScenarioExceptions.InvalidScenarioException("A Scenario response is required and must be at most 8000 characters");
		if (completing && input.response().trim().length() < 10) throw new ScenarioExceptions.InvalidScenarioException("Explain the response before completing the Scenario");
		if (tooLong(input.architectureChanges()) || tooLong(input.decisionChanges())) throw new ScenarioExceptions.InvalidScenarioException("Related changes must be at most 4000 characters");
	}
	private boolean tooLong(String value) { return value != null && value.trim().length() > 4000; }
	private String trim(String value) { return value.trim(); }
	private String nullableTrim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
	private ScenarioResponse response(ScenarioEntity entity) { return new ScenarioResponse(entity.getId(), entity.getSource().name(), entity.getOrderIndex(), entity.getTitle(), entity.getChangedCondition(), entity.getDetails(), entity.getCategory(), entity.getStatus().name(), entity.getResponse(), entity.getArchitectureChanges(), entity.getDecisionChanges(), entity.getCompletedAt()); }

	public record ResponseInput(String response, String architectureChanges, String decisionChanges) { }
	public record ScenarioResponse(UUID id, String source, int orderIndex, String title, String changedCondition, String details, String category, String status, String response, String architectureChanges, String decisionChanges, Instant completedAt) { }
}
