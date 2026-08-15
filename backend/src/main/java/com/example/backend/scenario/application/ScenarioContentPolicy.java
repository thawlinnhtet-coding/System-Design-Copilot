package com.example.backend.scenario.application;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class ScenarioContentPolicy {
	private static final Set<String> CATEGORIES = Set.of("GROWTH_SCALE", "FAILURE_RELIABILITY", "CONSISTENCY", "SECURITY", "OPERATIONS", "PRODUCT_CHANGE");

	public ScenarioDefinition validate(JsonNode node) {
		if (node == null || !node.isObject()) throw new ScenarioExceptions.InvalidAiScenarioException();
		var title = text(node, "title", 160);
		var changedCondition = text(node, "changedCondition", 1000);
		var details = text(node, "details", 4000);
		var category = text(node, "category", 32);
		if (!CATEGORIES.contains(category)) throw new ScenarioExceptions.InvalidAiScenarioException();
		return new ScenarioDefinition(title, changedCondition, details, category);
	}

	public ScenarioDefinition curated(String title, String changedCondition, String details, String category) {
		return validate(com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode()
				.put("title", title).put("changedCondition", changedCondition).put("details", details).put("category", category));
	}

	private String text(JsonNode node, String field, int max) {
		var value = node.path(field);
		if (!value.isTextual() || value.asText().isBlank() || value.asText().length() > max) throw new ScenarioExceptions.InvalidAiScenarioException();
		return value.asText().trim();
	}

	public record ScenarioDefinition(String title, String changedCondition, String details, String category) { }
}
