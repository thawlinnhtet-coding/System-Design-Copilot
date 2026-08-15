package com.example.backend.architecture.api;

import com.example.backend.architecture.application.ArchitectureReviewEntryExceptions.IdempotencyConflictException;
import com.example.backend.architecture.application.ArchitectureReviewEntryExceptions.InvalidIdempotencyKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class ArchitectureReviewEntryProblemAdvice {

	@ExceptionHandler(InvalidIdempotencyKeyException.class)
	ProblemDetail invalidIdempotencyKey(InvalidIdempotencyKeyException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
		problem.setTitle("Invalid idempotency key");
		problem.setProperty("code", "invalid_idempotency_key");
		return problem;
	}

	@ExceptionHandler(IdempotencyConflictException.class)
	ProblemDetail idempotencyConflict(IdempotencyConflictException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
		problem.setTitle("Idempotency key conflict");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/idempotency-key-conflict"));
		problem.setProperty("code", "idempotency_key_conflict");
		return problem;
	}
}
