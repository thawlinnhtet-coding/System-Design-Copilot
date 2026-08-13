package com.example.backend.billing.infrastructure;

import com.example.backend.billing.application.BillingClient;
import com.example.backend.billing.application.BillingProperties;
import com.example.backend.billing.application.BillingProviderException;
import com.example.backend.billing.application.BillingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
class StripeHttpBillingClient implements BillingClient {

	private static final URI STRIPE_API = URI.create("https://api.stripe.com/v1/");
	private static final Logger logger = LoggerFactory.getLogger(StripeHttpBillingClient.class);

	private final BillingProperties properties;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

	StripeHttpBillingClient(BillingProperties properties) {
		this.properties = properties;
	}

	@Override
	public String createCustomer(UUID userId, String idempotencyKey) {
		var body = form(Map.of("metadata[user_id]", userId.toString()));
		return text(post("customers", body, idempotencyKey), "id");
	}

	@Override
	public BillingService.CheckoutSession createCheckoutSession(String stripeCustomerId, String idempotencyKey) {
		var fields = new LinkedHashMap<String, String>();
		fields.put("mode", "subscription");
		fields.put("customer", stripeCustomerId);
		fields.put("line_items[0][price]", properties.proPriceId());
		fields.put("line_items[0][quantity]", "1");
		fields.put("success_url", properties.checkoutSuccessUrl());
		fields.put("cancel_url", properties.checkoutCancelUrl());
		var response = post("checkout/sessions", form(fields), idempotencyKey);
		return new BillingService.CheckoutSession(text(response, "id"), text(response, "url"));
	}

	@Override
	public BillingClient.StripeSubscription retrieveSubscription(String stripeSubscriptionId) {
		var response = get("subscriptions/" + URLEncoder.encode(stripeSubscriptionId, StandardCharsets.UTF_8));
		var periodEndSeconds = response.path("current_period_end").asLong(-1);
		if (periodEndSeconds < 0) {
			periodEndSeconds = response.path("items").path("data").path(0).path("current_period_end").asLong(-1);
		}
		if (periodEndSeconds < 0) {
			throw new BillingProviderException();
		}
		return new BillingClient.StripeSubscription(text(response, "id"), text(response, "customer"), text(response, "status"),
				java.time.Instant.ofEpochSecond(periodEndSeconds), response.path("cancel_at_period_end").asBoolean(false));
	}

	@Override
	public BillingClient.CheckoutCompletion retrieveCheckoutCompletion(String stripeCheckoutSessionId) {
		var response = get("checkout/sessions/" + URLEncoder.encode(stripeCheckoutSessionId, StandardCharsets.UTF_8));
		return new BillingClient.CheckoutCompletion(text(response, "customer"), text(response, "subscription"), text(response, "payment_status"));
	}

	@Override
	public BillingService.PortalSession createCustomerPortalSession(String stripeCustomerId) {
		var response = post("billing_portal/sessions", form(Map.of("customer", stripeCustomerId, "return_url", properties.portalReturnUrl())),
				"portal-" + UUID.randomUUID());
		return new BillingService.PortalSession(text(response, "url"));
	}

	private JsonNode post(String path, String body, String idempotencyKey) {
		if (properties.stripeSecretKey() == null || properties.stripeSecretKey().isBlank()) {
			throw new BillingProviderException();
		}
		try {
			var request = HttpRequest.newBuilder(STRIPE_API.resolve(path))
					.timeout(Duration.ofSeconds(20))
					.header("Authorization", "Bearer " + properties.stripeSecretKey())
					.header("Content-Type", "application/x-www-form-urlencoded")
					.header("Idempotency-Key", idempotencyKey)
					.POST(HttpRequest.BodyPublishers.ofString(body))
					.build();
			var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				logStripeFailure(path, response.statusCode(), response.body());
				throw new BillingProviderException();
			}
			return objectMapper.readTree(response.body());
		} catch (BillingProviderException exception) {
			throw exception;
		} catch (Exception exception) {
			logger.warn("Stripe request failed path={} reason={}", path, exception.getClass().getSimpleName());
			throw new BillingProviderException();
		}
	}

	private JsonNode get(String path) {
		if (properties.stripeSecretKey() == null || properties.stripeSecretKey().isBlank()) {
			throw new BillingProviderException();
		}
		try {
			var request = HttpRequest.newBuilder(STRIPE_API.resolve(path))
					.timeout(Duration.ofSeconds(20))
					.header("Authorization", "Bearer " + properties.stripeSecretKey())
					.GET()
					.build();
			var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				logStripeFailure(path, response.statusCode(), response.body());
				throw new BillingProviderException();
			}
			return objectMapper.readTree(response.body());
		} catch (BillingProviderException exception) {
			throw exception;
		} catch (Exception exception) {
			logger.warn("Stripe request failed path={} reason={}", path, exception.getClass().getSimpleName());
			throw new BillingProviderException();
		}
	}

	private void logStripeFailure(String path, int statusCode, String responseBody) {
		try {
			var error = objectMapper.readTree(responseBody).path("error");
			logger.warn("Stripe request rejected path={} status={} type={} code={} message={}",
					path, statusCode, error.path("type").asText("unknown"), error.path("code").asText("unknown"),
					error.path("message").asText("unknown"));
		} catch (Exception exception) {
			logger.warn("Stripe request rejected path={} status={} with an unreadable error response", path, statusCode);
		}
	}

	private String text(JsonNode node, String field) {
		var value = node.path(field).asText();
		if (value.isBlank()) {
			throw new BillingProviderException();
		}
		return value;
	}

	private String form(Map<String, String> fields) {
		return fields.entrySet().stream()
				.map(entry -> URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8))
				.reduce((left, right) -> left + "&" + right)
				.orElse("");
	}

}
