package com.example.backend.identity.infrastructure;

import com.example.backend.identity.application.PublicBetaAbuseProtectionProperties;
import com.example.backend.identity.application.VerifiedEmailPolicy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/** Disposable, in-process public-beta guard. Production deployments may back these limits with Redis. */
public class PublicBetaAbuseProtectionFilter extends OncePerRequestFilter {
	private static final Duration WINDOW = Duration.ofMinutes(1);
	private final PublicBetaAbuseProtectionProperties properties;
	private final VerifiedEmailPolicy verifiedEmailPolicy;
	private final Clock clock;
	private final ConcurrentHashMap<String, Window> originWindows = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, Window> userWindows = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, AtomicInteger> concurrentRequests = new ConcurrentHashMap<>();

	public PublicBetaAbuseProtectionFilter(PublicBetaAbuseProtectionProperties properties, VerifiedEmailPolicy verifiedEmailPolicy, Clock clock) {
		this.properties = properties;
		this.verifiedEmailPolicy = verifiedEmailPolicy;
		this.clock = clock;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		if (!request.getRequestURI().startsWith("/api/v1/") || request.getRequestURI().equals("/api/v1/webhooks/stripe")) return true;
		return !("POST".equals(request.getMethod()) || "PUT".equals(request.getMethod()) || "PATCH".equals(request.getMethod()) || "DELETE".equals(request.getMethod()));
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws IOException, jakarta.servlet.ServletException {
		var authentication = SecurityContextHolder.getContext().getAuthentication();
		if (!(authentication != null && authentication.getPrincipal() instanceof Jwt jwt)) {
			filterChain.doFilter(request, response);
			return;
		}
		var now = Instant.now(clock);
		var subject = jwt.getSubject();
		if (!increment(originWindows, originKey(request), properties.originRequestsPerMinute(), now) || !increment(userWindows, subject, properties.userRequestsPerMinute(), now)) {
			writeProblem(response, HttpStatus.TOO_MANY_REQUESTS, "Request rate limited", "Please wait before making another change.", "public_beta_rate_limited");
			return;
		}
		if (!verifiedEmailPolicy.isVerified(jwt) && count(userWindows, subject) >= properties.unverifiedChallengeThreshold()) {
			writeProblem(response, HttpStatus.TOO_MANY_REQUESTS, "Verification required to continue", "Verify ownership of your email address with Clerk before making more changes.", "adaptive_verification_required");
			return;
		}
		var active = concurrentRequests.computeIfAbsent(subject, ignored -> new AtomicInteger()).incrementAndGet();
		if (active > properties.concurrentRequestsPerUser()) {
			concurrentRequests.get(subject).decrementAndGet();
			writeProblem(response, HttpStatus.TOO_MANY_REQUESTS, "Too many concurrent requests", "Finish the pending request before starting another.", "concurrent_request_limit");
			return;
		}
		try {
			filterChain.doFilter(request, response);
		} finally {
			concurrentRequests.get(subject).decrementAndGet();
		}
	}

	private boolean increment(ConcurrentHashMap<String, Window> windows, String key, int limit, Instant now) {
		var accepted = new java.util.concurrent.atomic.AtomicBoolean();
		windows.compute(key, (ignored, current) -> {
			var window = current == null || !now.isBefore(current.startedAt().plus(WINDOW)) ? new Window(now, 0) : current;
			if (window.count() < limit) accepted.set(true);
			return new Window(window.startedAt(), window.count() + 1);
		});
		return accepted.get();
	}

	private int count(ConcurrentHashMap<String, Window> windows, String key) {
		var window = windows.get(key);
		return window == null ? 0 : window.count();
	}

	private String originKey(HttpServletRequest request) {
		var origin = request.getHeader("Origin");
		return origin == null || origin.isBlank() ? "ip:" + request.getRemoteAddr() : "origin:" + origin;
	}

	private void writeProblem(HttpServletResponse response, HttpStatus status, String title, String detail, String code) throws IOException {
		var problem = ProblemDetail.forStatusAndDetail(status, detail);
		problem.setTitle(title);
		problem.setType(URI.create("https://system-design-copilot.dev/problems/" + code.replace('_', '-')));
		problem.setProperty("code", code);
		response.setStatus(status.value());
		response.setContentType("application/problem+json");
		response.setHeader("Retry-After", "60");
		response.getWriter().write("{\"type\":\"" + problem.getType() + "\",\"title\":\"" + title + "\",\"status\":" + status.value() + ",\"detail\":\"" + detail + "\",\"code\":\"" + code + "\"}");
	}

	private record Window(Instant startedAt, int count) {
	}
}
