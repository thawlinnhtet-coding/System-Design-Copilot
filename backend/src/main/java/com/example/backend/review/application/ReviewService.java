package com.example.backend.review.application;

import com.example.backend.ai.application.*;
import com.example.backend.architecture.application.ArchitectureDocumentService;
import com.example.backend.entitlement.application.EntitlementService;
import com.example.backend.entitlement.application.QuotaExceededException;
import com.example.backend.review.infrastructure.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Service
public class ReviewService {
	private static final BigDecimal ESTIMATED_COST_USD=new BigDecimal("0.010000");
	private static final String PROMPT_VERSION="review-evidence-v1";
	private final ArchitectureDocumentService documents; private final EntitlementService entitlements; private final AiOperationService ai; private final ReviewRequestRepository requests; private final ReviewJobRepository jobs; private final ReviewOutboxEventRepository outbox; private final ReviewRepository reviews; private final ReviewProcessingProperties properties; private final ReviewOutputValidator validator; private final ObjectMapper mapper; private final Clock clock;
	public ReviewService(ArchitectureDocumentService documents,EntitlementService entitlements,AiOperationService ai,ReviewRequestRepository requests,ReviewJobRepository jobs,ReviewOutboxEventRepository outbox,ReviewRepository reviews,ReviewProcessingProperties properties,ObjectMapper mapper,Clock clock){this.documents=documents;this.entitlements=entitlements;this.ai=ai;this.requests=requests;this.jobs=jobs;this.outbox=outbox;this.reviews=reviews;this.properties=properties;this.mapper=mapper;this.validator=new ReviewOutputValidator(mapper);this.clock=clock;}
	@Transactional
	public ReviewSubmission submit(UUID userId,UUID workspaceId,String idempotencyKey){if(idempotencyKey==null||idempotencyKey.isBlank()||idempotencyKey.length()>255)throw new ReviewProcessingExceptions.InvalidIdempotencyKeyException(); var fingerprint=fingerprint(workspaceId); var existing=requests.findByUserIdAndIdempotencyKey(userId,idempotencyKey); if(existing.isPresent()){var request=existing.get();if(!request.getRequestFingerprint().equals(fingerprint))throw new ReviewProcessingExceptions.IdempotencyConflictException();return response(request);}
		var allowance=entitlements.currentEntitlements(userId).reviews();if(allowance.limit()!=null&&allowance.used()>=allowance.limit())throw new QuotaExceededException("reviews");
		var revision=documents.createRevision(userId,workspaceId); var now=Instant.now(clock); var request=requests.save(new ReviewRequestEntity(userId,workspaceId,revision.id(),idempotencyKey,fingerprint,now)); var job=jobs.save(new ReviewJobEntity(request.getId(),properties.maxAttempts(),now)); outbox.save(new ReviewOutboxEventEntity(job.getId(),now)); return response(request);
	}
	@Transactional(readOnly=true)
	public ReviewSubmission get(UUID userId,UUID reviewRequestId){var request=requests.findById(reviewRequestId).filter(value->value.getUserId().equals(userId)).orElseThrow(()->new IllegalArgumentException("Review request not found"));return response(request);}
	@Transactional
	public ProcessingOutcome process(UUID jobId,String workerId){var job=jobs.findLockedById(jobId).orElse(null);if(job==null||!job.claim(workerId,Instant.now(clock)))return ProcessingOutcome.IGNORED;var request=requests.findById(job.getReviewRequestId()).orElseThrow();request.processing();try{var snapshot=documents.reviewSnapshot(request.getUserId(),request.getWorkspaceId(),request.getRevisionId());var context=new AiBoundedContext(request.getWorkspaceId(),"Review only this immutable Architecture Revision. Return JSON with overallScore, summary, uncertainty, scores, and findings.\nDocument:\n"+snapshot.document()+"\nReasoning context:\n"+snapshot.reasoningContext());var result=ai.invoke(UUID.randomUUID(),request.getUserId(),AiProfile.REVIEW,context,ESTIMATED_COST_USD,PROMPT_VERSION);var output=validator.validate(result.content(),snapshot.document(),snapshot.reasoningContext());if(reviews.findByReviewRequestId(request.getId()).isEmpty())reviews.save(new ReviewEntity(request.getId(),request.getRevisionId(),mapper.writeValueAsString(output),result.model(),Instant.now(clock)));entitlements.recordCompletedReview(request.getUserId(),request.getId());request.complete(Instant.now(clock));job.complete(Instant.now(clock));return ProcessingOutcome.COMPLETED;}catch(ReviewProcessingExceptions.InvalidReviewOutputException exception){job.deadLetter("invalid_review_output",Instant.now(clock));request.fail("invalid_review_output");return ProcessingOutcome.FAILED;}catch(QuotaExceededException exception){job.deadLetter("review_quota_exceeded",Instant.now(clock));request.fail("review_quota_exceeded");return ProcessingOutcome.FAILED;}catch(RuntimeException exception){var code=exception instanceof AiProviderExceptions.UnavailableException?"ai_provider_unavailable":"review_processing_failed";if(job.exhausted()){job.deadLetter(code,Instant.now(clock));request.fail(code);return ProcessingOutcome.FAILED;}job.retry(code,Instant.now(clock));request.retrying(code);return ProcessingOutcome.RETRY; }catch(Exception exception){job.deadLetter("review_processing_failed",Instant.now(clock));request.fail("review_processing_failed");return ProcessingOutcome.FAILED;}}
	private ReviewSubmission response(ReviewRequestEntity request){return new ReviewSubmission(request.getId(),request.getWorkspaceId(),request.getRevisionId(),request.getStatus().name(),request.getErrorCode(),request.getCreatedAt(),request.getCompletedAt());}
	private String fingerprint(UUID workspaceId){try{return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(workspaceId.toString().getBytes(StandardCharsets.UTF_8)));}catch(Exception exception){throw new IllegalStateException(exception);}}
	public enum ProcessingOutcome { COMPLETED, RETRY, FAILED, IGNORED }
	public record ReviewSubmission(UUID id,UUID workspaceId,UUID revisionId,String status,String errorCode,Instant createdAt,Instant completedAt) { }
}
