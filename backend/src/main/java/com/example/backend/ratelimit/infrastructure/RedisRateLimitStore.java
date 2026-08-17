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
import java.util.UUID;

/** Disposable, atomic Redis counters for rate limits and short-lived concurrency guards. */
@Component
public class RedisRateLimitStore {
	private static final String WINDOW_SCRIPT = """
			local count = redis.call('INCR', KEYS[1])
			if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
			return count
			""";
	private static final String CONCURRENCY_ACQUIRE_SCRIPT = """
			redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
			local count = redis.call('ZCARD', KEYS[1])
			if count >= tonumber(ARGV[2]) then return 0 end
			redis.call('ZADD', KEYS[1], ARGV[1] + ARGV[3], ARGV[4])
			redis.call('EXPIRE', KEYS[1], ARGV[3])
			return count + 1
			""";
	private static final String CONCURRENCY_RELEASE_SCRIPT = """
			redis.call('ZREM', KEYS[1], ARGV[1])
			if redis.call('ZCARD', KEYS[1]) == 0 then redis.call('DEL', KEYS[1]) end
			return 1
			""";

	private final StringRedisTemplate redis;
	private final RedisRateLimitProperties properties;
	private final ConcurrentHashMap<String, LocalCounter> localCounters = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, ConcurrentHashMap<String, Long>> localLeases = new ConcurrentHashMap<>();

	public RedisRateLimitStore(StringRedisTemplate redis, RedisRateLimitProperties properties) {
		this.redis = redis;
		this.properties = properties;
	}

	public LimitDecision incrementWindow(String namespace, String identity, int limit, Duration window) {
		if (!properties.rateLimitsEnabled()) return localWindow(namespace, identity, limit, window);
		try {
			var count = redis.execute(new DefaultRedisScript<>(WINDOW_SCRIPT, Long.class), List.of(key(namespace, identity)), String.valueOf(window.toSeconds()));
			if (count == null) return LimitDecision.unavailable();
			return new LimitDecision(count <= limit, true, Math.toIntExact(count), null);
		} catch (RuntimeException exception) {
			return LimitDecision.unavailable();
		}
	}

	public LimitDecision acquireConcurrency(String namespace, String identity, int limit, Duration lease) {
		if (!properties.rateLimitsEnabled()) return localConcurrency(namespace, identity, limit, lease);
		try {
			var token = UUID.randomUUID().toString();
			var acquired = redis.execute(new DefaultRedisScript<>(CONCURRENCY_ACQUIRE_SCRIPT, Long.class), List.of(key(namespace, identity)), String.valueOf(System.currentTimeMillis()), String.valueOf(limit), String.valueOf(Math.max(1, lease.toSeconds())), token);
			if (acquired == null) return LimitDecision.unavailable();
			return new LimitDecision(acquired > 0L, true, acquired.intValue(), acquired > 0L ? token : null);
		} catch (RuntimeException exception) {
			return LimitDecision.unavailable();
		}
	}

	public void releaseConcurrency(String namespace, String identity, String leaseToken) {
		if (leaseToken == null || leaseToken.isBlank()) return;
		if (!properties.rateLimitsEnabled()) {
			var leases = localLeases.get(key(namespace, identity));
			if (leases != null) { leases.remove(leaseToken); if (leases.isEmpty()) localLeases.remove(key(namespace, identity), leases); }
			return;
		}
		try {
			redis.execute(new DefaultRedisScript<>(CONCURRENCY_RELEASE_SCRIPT, Long.class), List.of(key(namespace, identity)), leaseToken);
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
		return new LimitDecision(counter.count() <= limit, true, counter.count(), null);
	}

	private LimitDecision localConcurrency(String namespace, String identity, int limit, Duration lease) {
		var key = key(namespace, identity);
		var now = System.nanoTime();
		var token = UUID.randomUUID().toString();
		var leases = localLeases.computeIfAbsent(key, ignored -> new ConcurrentHashMap<>());
		leases.entrySet().removeIf(entry -> entry.getValue() <= now);
		if (leases.size() >= limit) return new LimitDecision(false, true, leases.size(), null);
		leases.put(token, now + lease.toNanos());
		return new LimitDecision(true, true, leases.size(), token);
	}

	private String sha256(String value) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
		} catch (Exception exception) {
			throw new IllegalStateException("SHA-256 is unavailable", exception);
		}
	}

	public record LimitDecision(boolean allowed, boolean available, int count, String leaseToken) {
		public static LimitDecision unavailable() {
			return new LimitDecision(false, false, 0, null);
		}
	}

	private record LocalCounter(long startedAt, int count) { }
}
