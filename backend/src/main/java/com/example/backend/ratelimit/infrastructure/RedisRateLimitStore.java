package com.example.backend.ratelimit.infrastructure;

import com.example.backend.ratelimit.application.RedisRateLimitProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/** Disposable, atomic Redis counters for rate limits and short-lived concurrency guards. */
@Component
public class RedisRateLimitStore {
	private static final String WINDOW_SCRIPT = """
			local count = redis.call('INCR', KEYS[1])
			if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
			return count
			""";
	private static final String CONCURRENCY_ACQUIRE_SCRIPT = """
			local count = redis.call('INCR', KEYS[1])
			if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
			if count > tonumber(ARGV[1]) then
				redis.call('DECR', KEYS[1])
				return 0
			end
			return 1
			""";
	private static final String CONCURRENCY_RELEASE_SCRIPT = """
			local count = redis.call('DECR', KEYS[1])
			if count <= 0 then redis.call('DEL', KEYS[1]) end
			return count
			""";

	private final StringRedisTemplate redis;
	private final RedisRateLimitProperties properties;
	private final ConcurrentHashMap<String, LocalCounter> localCounters = new ConcurrentHashMap<>();

	public RedisRateLimitStore(StringRedisTemplate redis, RedisRateLimitProperties properties) {
		this.redis = redis;
		this.properties = properties;
	}

	public LimitDecision incrementWindow(String namespace, String identity, int limit, Duration window) {
		if (!properties.rateLimitsEnabled()) return localWindow(namespace, identity, limit, window);
		try {
			var count = redis.execute(new DefaultRedisScript<>(WINDOW_SCRIPT, Long.class), List.of(key(namespace, identity)), String.valueOf(window.toSeconds()));
			if (count == null) return LimitDecision.unavailable();
			return new LimitDecision(count <= limit, true, Math.toIntExact(count));
		} catch (RuntimeException exception) {
			return LimitDecision.unavailable();
		}
	}

	public LimitDecision acquireConcurrency(String namespace, String identity, int limit, Duration lease) {
		if (!properties.rateLimitsEnabled()) return localConcurrency(namespace, identity, limit, lease);
		try {
			var acquired = redis.execute(new DefaultRedisScript<>(CONCURRENCY_ACQUIRE_SCRIPT, Long.class), List.of(key(namespace, identity)), String.valueOf(limit), String.valueOf(lease.toSeconds()));
			if (acquired == null) return LimitDecision.unavailable();
			return new LimitDecision(acquired == 1L, true, acquired.intValue());
		} catch (RuntimeException exception) {
			return LimitDecision.unavailable();
		}
	}

	public void releaseConcurrency(String namespace, String identity) {
		if (!properties.rateLimitsEnabled()) {
			localCounters.computeIfPresent(key(namespace, identity), (ignored, current) -> current.count() <= 1 ? null : new LocalCounter(current.startedAt(), current.count() - 1));
			return;
		}
		try {
			redis.execute(new DefaultRedisScript<>(CONCURRENCY_RELEASE_SCRIPT, Long.class), List.of(key(namespace, identity)));
		} catch (RuntimeException ignored) {
			// The lease expiry is the recovery path if Redis is unavailable during release.
		}
	}

	private String key(String namespace, String identity) {
		return "sdc:limit:" + namespace + ":" + sha256(identity);
	}

	private LimitDecision localWindow(String namespace, String identity, int limit, Duration window) {
		var key = key(namespace, identity);
		var now = System.nanoTime();
		var counter = localCounters.compute(key, (ignored, current) -> current == null || now - current.startedAt() >= window.toNanos() ? new LocalCounter(now, 1) : new LocalCounter(current.startedAt(), current.count() + 1));
		return new LimitDecision(counter.count() <= limit, true, counter.count());
	}

	private LimitDecision localConcurrency(String namespace, String identity, int limit, Duration lease) {
		var key = key(namespace, identity);
		var now = System.nanoTime();
		var counter = localCounters.compute(key, (ignored, current) -> current == null || now - current.startedAt() >= lease.toNanos() ? new LocalCounter(now, 1) : new LocalCounter(current.startedAt(), current.count() + 1));
		if (counter.count() > limit) {
			localCounters.computeIfPresent(key, (ignored, current) -> new LocalCounter(current.startedAt(), Math.max(0, current.count() - 1)));
			return new LimitDecision(false, true, counter.count() - 1);
		}
		return new LimitDecision(true, true, counter.count());
	}

	private String sha256(String value) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
		} catch (Exception exception) {
			throw new IllegalStateException("SHA-256 is unavailable", exception);
		}
	}

	public record LimitDecision(boolean allowed, boolean available, int count) {
		public static LimitDecision unavailable() {
			return new LimitDecision(false, false, 0);
		}
	}

	private record LocalCounter(long startedAt, int count) { }
}
