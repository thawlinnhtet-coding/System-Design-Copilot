package com.example.backend.identity.api;

import com.example.backend.identity.application.EmailVerificationRequiredException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class IdentityAccessProblemAdvice {
	@ExceptionHandler(EmailVerificationRequiredException.class)
	ProblemDetail emailVerificationRequired(EmailVerificationRequiredException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, exception.getMessage());
		problem.setTitle("Email verification required");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/email-verification-required"));
		problem.setProperty("code", "email_verification_required");
		return problem;
	}
}
