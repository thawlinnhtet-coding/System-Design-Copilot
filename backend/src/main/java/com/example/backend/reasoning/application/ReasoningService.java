package com.example.backend.reasoning.application;

import com.example.backend.reasoning.application.ReasoningExceptions.InvalidReasoningException;
import com.example.backend.reasoning.infrastructure.AssumptionEntity;
import com.example.backend.reasoning.infrastructure.AssumptionRepository;
import com.example.backend.reasoning.infrastructure.DecisionEntity;
import com.example.backend.reasoning.infrastructure.DecisionRepository;
import com.example.backend.reasoning.infrastructure.QuestionEntity;
import com.example.backend.reasoning.infrastructure.QuestionRepository;
import com.example.backend.reasoning.infrastructure.RequirementEntity;
import com.example.backend.reasoning.infrastructure.RequirementRepository;
import com.example.backend.reasoning.infrastructure.ReviewBriefEntity;
import com.example.backend.reasoning.infrastructure.ReviewBriefRepository;
import com.example.backend.workspace.application.WorkspaceAccess;
import com.example.backend.workspace.application.WorkspaceDataCleanup;
import com.example.backend.workspace.application.WorkspaceExceptions.WorkspaceNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReasoningService implements WorkspaceDataCleanup {

	private static final TypeReference<List<UUID>> UUID_LIST = new TypeReference<>() { };
	private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() { };

	private final WorkspaceAccess workspaceAccess;
	private final RequirementRepository requirementRepository;
	private final AssumptionRepository assumptionRepository;
	private final QuestionRepository questionRepository;
	private final DecisionRepository decisionRepository;
	private final ReviewBriefRepository reviewBriefRepository;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final Clock clock;

	public ReasoningService(
			WorkspaceAccess workspaceAccess,
			RequirementRepository requirementRepository,
			AssumptionRepository assumptionRepository,
			QuestionRepository questionRepository,
			DecisionRepository decisionRepository,
			ReviewBriefRepository reviewBriefRepository,
			Clock clock
	) {
		this.workspaceAccess = workspaceAccess;
		this.requirementRepository = requirementRepository;
		this.assumptionRepository = assumptionRepository;
		this.questionRepository = questionRepository;
		this.decisionRepository = decisionRepository;
		this.reviewBriefRepository = reviewBriefRepository;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public ReasoningResponse get(UUID userId, UUID workspaceId) {
		ensureWorkspace(userId, workspaceId);
		return response(userId, workspaceId);
	}

	@Transactional
	public RequirementResponse createRequirement(UUID userId, UUID workspaceId, RequirementInput input) {
		ensureEditableWorkspace(userId, workspaceId);
		validateRequirement(input);
		var now = now();
		var entity = new RequirementEntity(userId, workspaceId, input.kind(), input.statement(), input.priority(), input.status(),
				input.measurableTarget(), input.rationale(), input.source(), nextRequirementOrder(userId, workspaceId), now);
		return requirement(requirementRepository.save(entity));
	}

	@Transactional
	public RequirementResponse updateRequirement(UUID userId, UUID workspaceId, UUID id, RequirementInput input) {
		ensureEditableWorkspace(userId, workspaceId);
		validateRequirement(input);
		var entity = requirementRepository.findByIdAndWorkspaceIdAndUserId(id, workspaceId, userId).orElseThrow(WorkspaceNotFoundException::new);
		entity.update(input.kind(), input.statement(), input.priority(), input.status(), input.measurableTarget(), input.rationale(), input.source(), input.orderIndex(), now());
		return requirement(requirementRepository.save(entity));
	}

	@Transactional
	public void deleteRequirement(UUID userId, UUID workspaceId, UUID id) {
		ensureEditableWorkspace(userId, workspaceId);
		requirementRepository.delete(requirementRepository.findByIdAndWorkspaceIdAndUserId(id, workspaceId, userId).orElseThrow(WorkspaceNotFoundException::new));
	}

	@Transactional
	public AssumptionResponse createAssumption(UUID userId, UUID workspaceId, AssumptionInput input) {
		ensureEditableWorkspace(userId, workspaceId);
		validateAssumption(userId, workspaceId, input);
		var now = now();
		var entity = new AssumptionEntity(userId, workspaceId, input.category(), input.quantitativeValue(), input.unit(), input.rationale(),
				input.confidence(), input.status(), input.source(), writeIds(input.relatedRequirementIds()), nextAssumptionOrder(userId, workspaceId), now);
		return assumption(assumptionRepository.save(entity));
	}

	@Transactional
	public AssumptionResponse updateAssumption(UUID userId, UUID workspaceId, UUID id, AssumptionInput input) {
		ensureEditableWorkspace(userId, workspaceId);
		validateAssumption(userId, workspaceId, input);
		var entity = assumptionRepository.findByIdAndWorkspaceIdAndUserId(id, workspaceId, userId).orElseThrow(WorkspaceNotFoundException::new);
		entity.update(input.category(), input.quantitativeValue(), input.unit(), input.rationale(), input.confidence(), input.status(), input.source(), writeIds(input.relatedRequirementIds()), input.orderIndex(), now());
		return assumption(assumptionRepository.save(entity));
	}

	@Transactional
	public void deleteAssumption(UUID userId, UUID workspaceId, UUID id) {
		ensureEditableWorkspace(userId, workspaceId);
		assumptionRepository.delete(assumptionRepository.findByIdAndWorkspaceIdAndUserId(id, workspaceId, userId).orElseThrow(WorkspaceNotFoundException::new));
	}

	@Transactional
	public QuestionResponse createQuestion(UUID userId, UUID workspaceId, QuestionInput input) {
		ensureEditableWorkspace(userId, workspaceId);
		validateQuestion(userId, workspaceId, input);
		var now = now();
		var entity = new QuestionEntity(userId, workspaceId, input.question(), input.whyItMatters(), input.status(), input.resolutionNotes(),
				writeIds(input.relatedRequirementIds()), writeIds(input.relatedAssumptionIds()), input.resultingDecisionId(), nextQuestionOrder(userId, workspaceId), now);
		return question(questionRepository.save(entity));
	}

	@Transactional
	public QuestionResponse updateQuestion(UUID userId, UUID workspaceId, UUID id, QuestionInput input) {
		ensureEditableWorkspace(userId, workspaceId);
		validateQuestion(userId, workspaceId, input);
		var entity = questionRepository.findByIdAndWorkspaceIdAndUserId(id, workspaceId, userId).orElseThrow(WorkspaceNotFoundException::new);
		entity.update(input.question(), input.whyItMatters(), input.status(), input.resolutionNotes(), writeIds(input.relatedRequirementIds()), writeIds(input.relatedAssumptionIds()), input.resultingDecisionId(), input.orderIndex(), now());
		return question(questionRepository.save(entity));
	}

	@Transactional
	public void deleteQuestion(UUID userId, UUID workspaceId, UUID id) {
		ensureEditableWorkspace(userId, workspaceId);
		questionRepository.delete(questionRepository.findByIdAndWorkspaceIdAndUserId(id, workspaceId, userId).orElseThrow(WorkspaceNotFoundException::new));
	}

	@Transactional
	public DecisionResponse createDecision(UUID userId, UUID workspaceId, DecisionInput input) {
		ensureEditableWorkspace(userId, workspaceId);
		validateDecision(input);
		var now = now();
		var entity = new DecisionEntity(userId, workspaceId, input.title(), input.chosenOption(), input.rationale(), input.alternatives(),
				input.positiveConsequences(), input.risks(), input.status(), writeStrings(input.evidenceRefs()), nextDecisionOrder(userId, workspaceId), now);
		return decision(decisionRepository.save(entity));
	}

	@Transactional
	public DecisionResponse updateDecision(UUID userId, UUID workspaceId, UUID id, DecisionInput input) {
		ensureEditableWorkspace(userId, workspaceId);
		validateDecision(input);
		var entity = decisionRepository.findByIdAndWorkspaceIdAndUserId(id, workspaceId, userId).orElseThrow(WorkspaceNotFoundException::new);
		entity.update(input.title(), input.chosenOption(), input.rationale(), input.alternatives(), input.positiveConsequences(), input.risks(), input.status(), writeStrings(input.evidenceRefs()), input.orderIndex(), now());
		return decision(decisionRepository.save(entity));
	}

	@Transactional
	public void deleteDecision(UUID userId, UUID workspaceId, UUID id) {
		ensureEditableWorkspace(userId, workspaceId);
		decisionRepository.delete(decisionRepository.findByIdAndWorkspaceIdAndUserId(id, workspaceId, userId).orElseThrow(WorkspaceNotFoundException::new));
	}

	@Transactional
	public ReviewBriefResponse saveReviewBrief(UUID userId, UUID workspaceId, ReviewBriefInput input) {
		ensureEditableWorkspace(userId, workspaceId);
		if (input.systemDescription() == null || input.systemDescription().isBlank() || input.reviewGoal() == null || input.reviewGoal().isBlank()) {
			throw new InvalidReasoningException("Review Brief requires a System Description and Review Goal");
		}
		var existing = reviewBriefRepository.findByWorkspaceIdAndUserId(workspaceId, userId);
		if (existing.isPresent()) {
			var entity = existing.get();
			entity.update(input.systemDescription(), input.reviewGoal(), now());
			return reviewBrief(reviewBriefRepository.save(entity));
		}
		return reviewBrief(reviewBriefRepository.save(new ReviewBriefEntity(userId, workspaceId, input.systemDescription(), input.reviewGoal(), now())));
	}

	@Override
	@Transactional
	public void deleteForWorkspace(UUID workspaceId) {
		requirementRepository.deleteAllByWorkspaceId(workspaceId);
		assumptionRepository.deleteAllByWorkspaceId(workspaceId);
		questionRepository.deleteAllByWorkspaceId(workspaceId);
		decisionRepository.deleteAllByWorkspaceId(workspaceId);
		reviewBriefRepository.deleteByWorkspaceId(workspaceId);
	}

	private ReasoningResponse response(UUID userId, UUID workspaceId) {
		return new ReasoningResponse(
				requirementRepository.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(workspaceId, userId).stream().map(this::requirement).toList(),
				assumptionRepository.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(workspaceId, userId).stream().map(this::assumption).toList(),
				questionRepository.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(workspaceId, userId).stream().map(this::question).toList(),
				decisionRepository.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(workspaceId, userId).stream().map(this::decision).toList(),
				reviewBriefRepository.findByWorkspaceIdAndUserId(workspaceId, userId).map(this::reviewBrief).orElse(null)
		);
	}

	private void ensureWorkspace(UUID userId, UUID workspaceId) {
		workspaceAccess.requireOwned(userId, workspaceId);
	}

	private void ensureEditableWorkspace(UUID userId, UUID workspaceId) {
		workspaceAccess.requireEditable(userId, workspaceId);
	}

	private void validateRequirement(RequirementInput input) {
		requireValue(input.kind(), "kind", "FUNCTIONAL", "NON_FUNCTIONAL");
		requireValue(input.priority(), "priority", "MUST", "SHOULD", "COULD");
		requireValue(input.status(), "status", "OPEN", "SATISFIED", "DROPPED");
	}

	private void validateAssumption(UUID userId, UUID workspaceId, AssumptionInput input) {
		requireValue(input.confidence(), "confidence", "LOW", "MEDIUM", "HIGH");
		requireValue(input.status(), "status", "ACTIVE", "OUTDATED");
		var requirementIds = input.relatedRequirementIds() == null ? List.<UUID>of() : input.relatedRequirementIds();
		if (requirementRepository.countByIdInAndWorkspaceIdAndUserId(requirementIds, workspaceId, userId) != requirementIds.size()) {
			throw new InvalidReasoningException("Assumptions can only reference Requirements in this Workspace");
		}
	}

	private void validateQuestion(UUID userId, UUID workspaceId, QuestionInput input) {
		requireValue(input.status(), "status", "OPEN", "RESOLVED", "DEFERRED");
		var requirementIds = input.relatedRequirementIds() == null ? List.<UUID>of() : input.relatedRequirementIds();
		var assumptionIds = input.relatedAssumptionIds() == null ? List.<UUID>of() : input.relatedAssumptionIds();
		if (requirementRepository.countByIdInAndWorkspaceIdAndUserId(requirementIds, workspaceId, userId) != requirementIds.size()) {
			throw new InvalidReasoningException("Questions can only reference Requirements in this Workspace");
		}
		if (assumptionRepository.countByIdInAndWorkspaceIdAndUserId(assumptionIds, workspaceId, userId) != assumptionIds.size()) {
			throw new InvalidReasoningException("Questions can only reference Assumptions in this Workspace");
		}
		if (input.resultingDecisionId() != null && decisionRepository.findByIdAndWorkspaceIdAndUserId(input.resultingDecisionId(), workspaceId, userId).isEmpty()) {
			throw new InvalidReasoningException("Questions can only reference Decisions in this Workspace");
		}
	}

	private void validateDecision(DecisionInput input) {
		requireValue(input.status(), "status", "PROPOSED", "ACCEPTED", "SUPERSEDED");
	}

	private void requireValue(String value, String field, String... allowed) {
		if (value == null || java.util.Arrays.stream(allowed).noneMatch(value::equals)) {
			throw new InvalidReasoningException("Unsupported " + field + " value");
		}
	}

	private int nextRequirementOrder(UUID userId, UUID workspaceId) { return requirementRepository.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(workspaceId, userId).size(); }
	private int nextAssumptionOrder(UUID userId, UUID workspaceId) { return assumptionRepository.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(workspaceId, userId).size(); }
	private int nextQuestionOrder(UUID userId, UUID workspaceId) { return questionRepository.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(workspaceId, userId).size(); }
	private int nextDecisionOrder(UUID userId, UUID workspaceId) { return decisionRepository.findAllByWorkspaceIdAndUserIdOrderByOrderIndexAscUpdatedAtAsc(workspaceId, userId).size(); }
	private Instant now() { return Instant.now(clock); }

	private String writeIds(List<UUID> values) { return write(values == null ? List.of() : values); }
	private String writeStrings(List<String> values) { return write(values == null ? List.of() : values); }
	private <T> String write(T value) {
		try { return objectMapper.writeValueAsString(value); }
		catch (JsonProcessingException exception) { throw new IllegalStateException("Unable to store reasoning references", exception); }
	}
	private <T> List<T> read(String value, TypeReference<List<T>> type) {
		try { return objectMapper.readValue(value, type); }
		catch (JsonProcessingException exception) { throw new IllegalStateException("Unable to read reasoning references", exception); }
	}

	private RequirementResponse requirement(RequirementEntity entity) {
		return new RequirementResponse(entity.getId(), entity.getKind(), entity.getStatement(), entity.getPriority(), entity.getStatus(), entity.getMeasurableTarget(), entity.getRationale(), entity.getSource(), entity.getOrderIndex(), entity.getCreatedAt(), entity.getUpdatedAt());
	}
	private AssumptionResponse assumption(AssumptionEntity entity) {
		return new AssumptionResponse(entity.getId(), entity.getCategory(), entity.getQuantitativeValue(), entity.getUnit(), entity.getRationale(), entity.getConfidence(), entity.getStatus(), entity.getSource(), read(entity.getRelatedRequirementIds(), UUID_LIST), entity.getOrderIndex(), entity.getCreatedAt(), entity.getUpdatedAt());
	}
	private QuestionResponse question(QuestionEntity entity) {
		return new QuestionResponse(entity.getId(), entity.getQuestion(), entity.getWhyItMatters(), entity.getStatus(), entity.getResolutionNotes(), read(entity.getRelatedRequirementIds(), UUID_LIST), read(entity.getRelatedAssumptionIds(), UUID_LIST), entity.getResultingDecisionId(), entity.getOrderIndex(), entity.getCreatedAt(), entity.getUpdatedAt());
	}
	private DecisionResponse decision(DecisionEntity entity) {
		return new DecisionResponse(entity.getId(), entity.getTitle(), entity.getChosenOption(), entity.getRationale(), entity.getAlternatives(), entity.getPositiveConsequences(), entity.getRisks(), entity.getStatus(), read(entity.getEvidenceRefs(), STRING_LIST), entity.getOrderIndex(), entity.getCreatedAt(), entity.getUpdatedAt());
	}
	private ReviewBriefResponse reviewBrief(ReviewBriefEntity entity) {
		return new ReviewBriefResponse(entity.getWorkspaceId(), entity.getSystemDescription(), entity.getReviewGoal(), entity.getCreatedAt(), entity.getUpdatedAt());
	}

	public record RequirementInput(String kind, String statement, String priority, String status, String measurableTarget, String rationale, String source, Integer orderIndex) { }
	public record AssumptionInput(String category, String quantitativeValue, String unit, String rationale, String confidence, String status, String source, List<UUID> relatedRequirementIds, Integer orderIndex) { }
	public record QuestionInput(String question, String whyItMatters, String status, String resolutionNotes, List<UUID> relatedRequirementIds, List<UUID> relatedAssumptionIds, UUID resultingDecisionId, Integer orderIndex) { }
	public record DecisionInput(String title, String chosenOption, String rationale, String alternatives, String positiveConsequences, String risks, String status, List<String> evidenceRefs, Integer orderIndex) { }
	public record ReviewBriefInput(String systemDescription, String reviewGoal) { }

	public record ReasoningResponse(List<RequirementResponse> requirements, List<AssumptionResponse> assumptions, List<QuestionResponse> questions, List<DecisionResponse> decisions, ReviewBriefResponse reviewBrief) { }
	public record RequirementResponse(UUID id, String kind, String statement, String priority, String status, String measurableTarget, String rationale, String source, int orderIndex, Instant createdAt, Instant updatedAt) { }
	public record AssumptionResponse(UUID id, String category, String quantitativeValue, String unit, String rationale, String confidence, String status, String source, List<UUID> relatedRequirementIds, int orderIndex, Instant createdAt, Instant updatedAt) { }
	public record QuestionResponse(UUID id, String question, String whyItMatters, String status, String resolutionNotes, List<UUID> relatedRequirementIds, List<UUID> relatedAssumptionIds, UUID resultingDecisionId, int orderIndex, Instant createdAt, Instant updatedAt) { }
	public record DecisionResponse(UUID id, String title, String chosenOption, String rationale, String alternatives, String positiveConsequences, String risks, String status, List<String> evidenceRefs, int orderIndex, Instant createdAt, Instant updatedAt) { }
	public record ReviewBriefResponse(UUID workspaceId, String systemDescription, String reviewGoal, Instant createdAt, Instant updatedAt) { }
}
