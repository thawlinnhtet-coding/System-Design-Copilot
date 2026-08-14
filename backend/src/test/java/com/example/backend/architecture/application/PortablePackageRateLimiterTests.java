package com.example.backend.architecture.application;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PortablePackageRateLimiterTests {
	@Test
	void limitsRepeatedImportRequestsPerUser() {
		var limiter = new PortablePackageRateLimiter(Clock.fixed(Instant.parse("2026-08-14T00:00:00Z"), ZoneOffset.UTC));
		var userId = UUID.randomUUID();
		for (var attempt = 0; attempt < 30; attempt++) limiter.check(userId);

		assertThatThrownBy(() -> limiter.check(userId))
				.isInstanceOf(PortablePackageRateLimiter.PortablePackageRateLimitException.class);
	}
}
