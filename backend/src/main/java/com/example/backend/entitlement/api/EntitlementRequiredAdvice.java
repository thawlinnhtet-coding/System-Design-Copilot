package com.example.backend.entitlement.api;

import com.example.backend.entitlement.application.EntitlementRequiredException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class EntitlementRequiredAdvice {
	@ExceptionHandler(EntitlementRequiredException.class)
	ProblemDetail entitlementRequired(EntitlementRequiredException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, exception.getMessage());
		problem.setTitle("Entitlement required");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/entitlement-required"));
		problem.setProperty("code", "entitlement_required");
		problem.setProperty("entitlement", exception.entitlement());
		return problem;
	}
}
