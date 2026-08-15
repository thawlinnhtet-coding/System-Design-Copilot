package com.example.backend.review.api;

import com.example.backend.review.application.ReviewProcessingExceptions.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.net.URI;

@RestControllerAdvice
class ReviewProblemAdvice {
	@ExceptionHandler(InvalidIdempotencyKeyException.class) ProblemDetail invalidKey(RuntimeException e){return problem(HttpStatus.BAD_REQUEST,"invalid_idempotency_key",e.getMessage());}
	@ExceptionHandler(IdempotencyConflictException.class) ProblemDetail conflict(RuntimeException e){return problem(HttpStatus.CONFLICT,"idempotency_conflict",e.getMessage());}
	@ExceptionHandler(IllegalArgumentException.class) ProblemDetail notFound(IllegalArgumentException e){return problem(HttpStatus.NOT_FOUND,"review_request_not_found",e.getMessage());}
	private ProblemDetail problem(HttpStatus status,String code,String detail){var result=ProblemDetail.forStatusAndDetail(status,detail);result.setType(URI.create("https://system-design-copilot.dev/problems/"+code));result.setProperty("code",code);return result;}
}
