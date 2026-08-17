package com.example.backend.identity.api;

import com.example.backend.identity.application.EmailVerificationRequiredException;
import com.example.backend.identity.infrastructure.AccountDeletionProviderException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class IdentityAccessProblemAdvice {
	@ExceptionHandler(AccountDeletionProviderException.class)
	ProblemDetail deletionProviderUnavailable() { return problem(HttpStatus.SERVICE_UNAVAILABLE, "Account deletion could not be completed. Try again shortly.", "account_deletion_provider_unavailable"); }
	@ExceptionHandler(EmailVerificationRequiredException.class)
	ProblemDetail emailVerificationRequired(EmailVerificationRequiredException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, exception.getMessage());
		problem.setTitle("Email verification required");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/email-verification-required"));
		problem.setProperty("code", "email_verification_required");
		return problem;
	}
	private ProblemDetail problem(HttpStatus status, String detail, String code) { var problem = ProblemDetail.forStatusAndDetail(status, detail); problem.setProperty("code", code); return problem; }
}
