package com.example.backend.challenge.api;

import com.example.backend.challenge.application.ChallengeExceptions.ChallengeNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class ChallengeProblemAdvice {
	@ExceptionHandler(ChallengeNotFoundException.class)
	ProblemDetail challengeNotFound(ChallengeNotFoundException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
		problem.setTitle("Challenge not found");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/challenge-not-found"));
		problem.setProperty("code", "challenge_not_found");
		return problem;
	}
}
