package com.example.backend.architecture.application;

import com.example.backend.ratelimit.infrastructure.RedisRateLimitStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Process-local disposable protection until the shared Redis rate-limit boundary is available. */
@Component
public final class PortablePackageRateLimiter {
	private static final int MAX_REQUESTS = 30;
	private static final Duration WINDOW = Duration.ofMinutes(1);
	private final ConcurrentHashMap<UUID, Window> windows = new ConcurrentHashMap<>();
	private final Clock clock;
	private final RedisRateLimitStore redis;

	public PortablePackageRateLimiter(Clock clock) { this(null, clock); }

	@Autowired
	public PortablePackageRateLimiter(RedisRateLimitStore redis, Clock clock) {
		this.redis = redis;
		this.clock = clock;
	}

	public void check(UUID userId) {
		if (redis != null) {
			var decision = redis.incrementWindow("portable-package-minute", userId.toString(), MAX_REQUESTS, WINDOW);
			if (!decision.available() || !decision.allowed()) throw new PortablePackageRateLimitException();
			return;
		}
		var now = Instant.now(clock);
		windows.compute(userId, (key, current) -> {
			var window = current == null || now.isAfter(current.startedAt().plus(WINDOW)) ? new Window(now, 0) : current;
			if (window.count() >= MAX_REQUESTS) throw new PortablePackageRateLimitException();
			return new Window(window.startedAt(), window.count() + 1);
		});
	}

	private record Window(Instant startedAt, int count) { }
	public static class PortablePackageRateLimitException extends RuntimeException {
		public PortablePackageRateLimitException() { super("Import validation is temporarily rate limited"); }
	}
}
