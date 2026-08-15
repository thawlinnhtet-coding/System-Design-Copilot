package com.example.backend.challenge.api;

import com.example.backend.challenge.application.ChallengeContentOperationsService.ChallengeContentOperatorForbiddenException;
import com.example.backend.challenge.application.ChallengeContentOperationsService.InvalidChallengeContentLifecycleException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice(assignableTypes = ChallengeContentOperationsController.class)
class ChallengeContentOperationsProblemAdvice {
	@ExceptionHandler(ChallengeContentOperatorForbiddenException.class)
	ProblemDetail forbidden(ChallengeContentOperatorForbiddenException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, exception.getMessage());
		problem.setType(URI.create("https://system-design-copilot.dev/problems/challenge-content-operator-forbidden"));
		problem.setProperty("code", "challenge_content_operator_forbidden");
		return problem;
	}

	@ExceptionHandler(InvalidChallengeContentLifecycleException.class)
	ProblemDetail invalidLifecycle(InvalidChallengeContentLifecycleException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
		problem.setType(URI.create("https://system-design-copilot.dev/problems/invalid-challenge-content-lifecycle"));
		problem.setProperty("code", "invalid_challenge_content_lifecycle");
		return problem;
	}
}
