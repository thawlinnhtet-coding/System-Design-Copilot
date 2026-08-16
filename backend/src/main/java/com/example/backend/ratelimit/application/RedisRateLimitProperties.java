package com.example.backend.ratelimit.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.redis")
public record RedisRateLimitProperties(boolean rateLimitsEnabled) {
}
