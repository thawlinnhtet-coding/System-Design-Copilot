package com.example.backend.architecture.api;

import com.example.backend.architecture.application.PortablePackageService.InvalidPortablePackageException;
import com.example.backend.architecture.application.PortablePackageRateLimiter.PortablePackageRateLimitException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class PortablePackageProblemAdvice {
	@ExceptionHandler(InvalidPortablePackageException.class)
	ProblemDetail invalid(InvalidPortablePackageException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "The Import Package is not valid");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/invalid_import_package"));
		problem.setProperty("code", "invalid_import_package");
		problem.setProperty("errors", exception.errors());
		return problem;
	}

	@ExceptionHandler(PortablePackageRateLimitException.class)
	ProblemDetail rateLimited(PortablePackageRateLimitException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, exception.getMessage());
		problem.setType(URI.create("https://system-design-copilot.dev/problems/import_rate_limited"));
		problem.setProperty("code", "import_rate_limited");
		return problem;
	}
}
