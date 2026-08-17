package com.example.backend.identity.infrastructure;

import com.example.backend.identity.application.PublicBetaAbuseProtectionProperties;
import com.example.backend.identity.application.VerifiedEmailPolicy;
import com.example.backend.ratelimit.infrastructure.RedisRateLimitStore;
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
import java.time.Duration;

/** Redis-backed, disposable public-beta guard. PostgreSQL remains authoritative for product state. */
public class PublicBetaAbuseProtectionFilter extends OncePerRequestFilter {
	private static final Duration WINDOW = Duration.ofMinutes(1);
	private static final Duration CONCURRENCY_LEASE = Duration.ofMinutes(2);
	private final PublicBetaAbuseProtectionProperties properties;
	private final VerifiedEmailPolicy verifiedEmailPolicy;
	private final RedisRateLimitStore limits;

	public PublicBetaAbuseProtectionFilter(PublicBetaAbuseProtectionProperties properties, VerifiedEmailPolicy verifiedEmailPolicy, RedisRateLimitStore limits) {
		this.properties = properties;
		this.verifiedEmailPolicy = verifiedEmailPolicy;
		this.limits = limits;
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
		var subject = jwt.getSubject();
		var origin = limits.incrementWindow("origin-minute", originKey(request), properties.originRequestsPerMinute(), WINDOW);
		var user = limits.incrementWindow("user-minute", subject, properties.userRequestsPerMinute(), WINDOW);
		if (!origin.available() || !user.available()) {
			writeProblem(response, HttpStatus.SERVICE_UNAVAILABLE, "Rate-limit service unavailable", "Please retry shortly.", "rate_limit_unavailable");
			return;
		}
		if (!origin.allowed() || !user.allowed()) {
			writeProblem(response, HttpStatus.TOO_MANY_REQUESTS, "Request rate limited", "Please wait before making another change.", "public_beta_rate_limited");
			return;
		}
		if (!verifiedEmailPolicy.isVerified(jwt) && user.count() >= properties.unverifiedChallengeThreshold()) {
			writeProblem(response, HttpStatus.TOO_MANY_REQUESTS, "Verification required to continue", "Verify ownership of your email address with Clerk before making more changes.", "adaptive_verification_required");
			return;
		}
		var concurrency = limits.acquireConcurrency("user-concurrent", subject, properties.concurrentRequestsPerUser(), CONCURRENCY_LEASE);
		if (!concurrency.available()) {
			writeProblem(response, HttpStatus.SERVICE_UNAVAILABLE, "Concurrency service unavailable", "Please retry shortly.", "rate_limit_unavailable");
			return;
		}
		if (!concurrency.allowed()) {
			writeProblem(response, HttpStatus.TOO_MANY_REQUESTS, "Too many concurrent requests", "Finish the pending request before starting another.", "concurrent_request_limit");
			return;
		}
		try {
			filterChain.doFilter(request, response);
		} finally {
			limits.releaseConcurrency("user-concurrent", subject, concurrency.leaseToken());
		}
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
}
