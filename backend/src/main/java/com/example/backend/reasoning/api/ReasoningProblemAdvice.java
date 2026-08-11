package com.example.backend.reasoning.api;

import com.example.backend.reasoning.application.ReasoningExceptions.InvalidReasoningException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class ReasoningProblemAdvice {

	@ExceptionHandler(InvalidReasoningException.class)
	ProblemDetail invalidReasoning(InvalidReasoningException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
		problem.setTitle("Invalid Workspace reasoning");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/invalid-reasoning"));
		problem.setProperty("code", "invalid_reasoning");
		return problem;
	}
}
