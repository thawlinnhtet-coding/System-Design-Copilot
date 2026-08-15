package com.example.backend.review.application;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.review")
public record ReviewProcessingProperties(String queueName, String deadLetterQueueName, @Min(1) @Max(10) int maxAttempts, boolean workerEnabled, boolean outboxPublisherEnabled) { }
