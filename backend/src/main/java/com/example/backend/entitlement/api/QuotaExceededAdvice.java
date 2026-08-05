package com.example.backend.entitlement.api;

import com.example.backend.entitlement.application.QuotaExceededException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class QuotaExceededAdvice {

	@ExceptionHandler(QuotaExceededException.class)
	ProblemDetail quotaExceeded(QuotaExceededException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, exception.getMessage());
		problem.setTitle("Allowance exceeded");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/allowance-exceeded"));
		problem.setProperty("code", "allowance_exceeded");
		problem.setProperty("allowance", exception.allowance());
		return problem;
	}

}
