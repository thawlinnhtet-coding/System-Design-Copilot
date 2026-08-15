package com.example.backend.scenario.api;

import com.example.backend.scenario.application.ScenarioExceptions.InvalidAiScenarioException;
import com.example.backend.scenario.application.ScenarioExceptions.InvalidScenarioException;
import com.example.backend.scenario.application.ScenarioExceptions.ScenarioNotFoundException;
import com.example.backend.scenario.application.ScenarioExceptions.ScenarioUnavailableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class ScenarioProblemAdvice {
	@ExceptionHandler(ScenarioNotFoundException.class) ProblemDetail notFound(ScenarioNotFoundException exception) { return problem(HttpStatus.NOT_FOUND, "scenario_not_found", exception.getMessage()); }
	@ExceptionHandler(ScenarioUnavailableException.class) ProblemDetail unavailable(ScenarioUnavailableException exception) { return problem(HttpStatus.CONFLICT, "scenario_unavailable", exception.getMessage()); }
	@ExceptionHandler(InvalidScenarioException.class) ProblemDetail invalid(InvalidScenarioException exception) { return problem(HttpStatus.BAD_REQUEST, "invalid_scenario", exception.getMessage()); }
	@ExceptionHandler(InvalidAiScenarioException.class) ProblemDetail invalidAi(InvalidAiScenarioException exception) { return problem(HttpStatus.UNPROCESSABLE_ENTITY, "invalid_ai_scenario", exception.getMessage()); }
	private ProblemDetail problem(HttpStatus status, String code, String detail) { var problem = ProblemDetail.forStatusAndDetail(status, detail); problem.setType(URI.create("https://system-design-copilot.dev/problems/" + code)); problem.setProperty("code", code); return problem; }
}
