package com.example.backend.scenario.application;

public final class ScenarioExceptions {
	private ScenarioExceptions() { }

	public static class ScenarioNotFoundException extends RuntimeException { public ScenarioNotFoundException() { super("Scenario not found in this Workspace"); } }
	public static class ScenarioUnavailableException extends RuntimeException { public ScenarioUnavailableException() { super("Complete or review the current Scenario before starting another"); } }
	public static class InvalidScenarioException extends RuntimeException { public InvalidScenarioException(String message) { super(message); } }
	public static class InvalidAiScenarioException extends RuntimeException { public InvalidAiScenarioException() { super("AI-assisted Scenario output was not valid and was not shown"); } }
}
