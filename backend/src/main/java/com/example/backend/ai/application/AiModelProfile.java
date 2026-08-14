package com.example.backend.ai.application;

public record AiModelProfile(AiProfile profile, String model, int maxOutputTokens) {
}
