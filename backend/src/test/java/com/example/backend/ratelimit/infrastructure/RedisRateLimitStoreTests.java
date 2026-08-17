package com.example.backend.ratelimit.infrastructure;

import com.example.backend.ratelimit.application.RedisRateLimitProperties;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class RedisRateLimitStoreTests {
	@Test
	void disabledStoreUsesTheExplicitTestOnlyLocalCounter() {
		var store = new RedisRateLimitStore(null, new RedisRateLimitProperties(false));

		assertThat(store.incrementWindow("test", "user", 2, Duration.ofMinutes(1)).allowed()).isTrue();
		assertThat(store.incrementWindow("test", "user", 2, Duration.ofMinutes(1)).allowed()).isTrue();
		assertThat(store.incrementWindow("test", "user", 2, Duration.ofMinutes(1)).allowed()).isFalse();
	}

	@Test
	void disabledConcurrencyCounterReleasesLeases() {
		var store = new RedisRateLimitStore(null, new RedisRateLimitProperties(false));

		var first = store.acquireConcurrency("test", "user", 1, Duration.ofMinutes(2));
		assertThat(first.allowed()).isTrue();
		assertThat(store.acquireConcurrency("test", "user", 1, Duration.ofMinutes(2)).allowed()).isFalse();
		store.releaseConcurrency("test", "user", first.leaseToken());
		assertThat(store.acquireConcurrency("test", "user", 1, Duration.ofMinutes(2)).allowed()).isTrue();
	}

	@Test
	void releasingAnExpiredLeaseCannotReleaseAReplacementLease() {
		var store = new RedisRateLimitStore(null, new RedisRateLimitProperties(false));
		var first = store.acquireConcurrency("test", "replacement", 1, Duration.ZERO);
		var replacement = store.acquireConcurrency("test", "replacement", 1, Duration.ofMinutes(2));
		store.releaseConcurrency("test", "replacement", first.leaseToken());
		assertThat(replacement.allowed()).isTrue();
		assertThat(store.acquireConcurrency("test", "replacement", 1, Duration.ofMinutes(2)).allowed()).isFalse();
	}
}
