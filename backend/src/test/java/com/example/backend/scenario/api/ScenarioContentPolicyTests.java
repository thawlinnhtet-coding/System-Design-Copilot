package com.example.backend.scenario.api;

import com.example.backend.scenario.application.ScenarioContentPolicy;
import com.example.backend.scenario.application.ScenarioExceptions;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class ScenarioContentPolicyTests {
	private final ScenarioContentPolicy policy = new ScenarioContentPolicy();
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void rejectsAiOutputThatDoesNotMatchTheScenarioSchema() throws Exception {
		assertThrows(ScenarioExceptions.InvalidAiScenarioException.class, () -> policy.validate(objectMapper.readTree("{\"title\":\"Unsafe\",\"changedCondition\":\"x\",\"details\":\"y\",\"category\":\"SOLUTION\"}")));
	}
}
