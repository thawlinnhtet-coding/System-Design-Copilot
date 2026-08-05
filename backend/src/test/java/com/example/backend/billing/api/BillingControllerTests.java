package com.example.backend.billing.api;

import com.example.backend.billing.application.BillingClient;
import com.example.backend.billing.application.BillingService;
import com.example.backend.identity.infrastructure.ClerkJwtValidator;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(BillingControllerTests.TestBillingConfiguration.class)
class BillingControllerTests {

	private static final String ISSUER = "https://clerk.test";
	private static final String AUDIENCE = "system-design-copilot-api";
	private static final String AUTHORIZED_PARTY = "http://localhost:3000";
	private static final String WEBHOOK_SECRET = "whsec_test_webhook_secret";
	private static final KeyPair SIGNING_KEY = createKeyPair();

	@Autowired
	private MockMvc mockMvc;

	@Test
	void deniesCheckoutForUsersOtherThanTheConfiguredSyntheticAccount() throws Exception {
		mockMvc.perform(post("/api/v1/billing/checkout")
				.header("Authorization", bearerToken("personal_beta_user"))
				.header("Idempotency-Key", "checkout-denied"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("billing_access_denied"));
	}

	@Test
	void startsCheckoutButGrantsProOnlyAfterAVerifiedWebhook() throws Exception {
		mockMvc.perform(post("/api/v1/billing/checkout")
				.header("Authorization", bearerToken("synthetic_test_user"))
				.header("Idempotency-Key", "checkout-success"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value("cs_test"))
				.andExpect(jsonPath("$.url").value("https://checkout.stripe.test/cs_test"));

		mockMvc.perform(get("/api/v1/me/usage").header("Authorization", bearerToken("synthetic_test_user")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.plan").value("FREE"));

		var webhook = subscriptionEvent("evt_endpoint_" + System.nanoTime(), Instant.now().plusSeconds(5));
		mockMvc.perform(post("/api/v1/webhooks/stripe")
				.contentType("application/json")
				.content(webhook)
				.header("Stripe-Signature", signedHeader(webhook)))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/me/usage").header("Authorization", bearerToken("synthetic_test_user")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.plan").value("PRO"))
				.andExpect(jsonPath("$.activeWorkspaces.limit").value(org.hamcrest.Matchers.nullValue()));

		mockMvc.perform(post("/api/v1/billing/portal").header("Authorization", bearerToken("synthetic_test_user")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.url").value("https://billing.stripe.test/portal"));
	}

	@Test
	void rejectsUnsignedWebhookBeforeProcessingItsJson() throws Exception {
		mockMvc.perform(post("/api/v1/webhooks/stripe")
				.contentType("application/json")
				.content("{")
				.header("Stripe-Signature", "t=" + Instant.now().getEpochSecond() + ",v1=bad"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("stripe_webhook_invalid"));
	}

	@Test
	void publishesCheckoutAndStripeWebhookContracts() throws Exception {
		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.paths['/api/v1/billing/checkout'].post").exists())
				.andExpect(jsonPath("$.paths['/api/v1/billing/portal'].post").exists())
				.andExpect(jsonPath("$.paths['/api/v1/webhooks/stripe'].post.responses['204']").exists())
				.andExpect(jsonPath("$.components.schemas.Allowance.properties.limit.type").value(org.hamcrest.Matchers.contains("integer", "null")));
	}

	@Test
	void permitsTheCheckoutIdempotencyKeyInBrowserCorsPreflight() throws Exception {
		mockMvc.perform(options("/api/v1/billing/checkout")
				.header("Origin", "http://localhost:3000")
				.header("Access-Control-Request-Method", "POST")
				.header("Access-Control-Request-Headers", "authorization,idempotency-key"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Headers", org.hamcrest.Matchers.containsString("idempotency-key")));
	}

	private static String bearerToken(String subject) throws Exception {
		var claims = new JWTClaimsSet.Builder()
				.subject(subject)
				.issuer(ISSUER)
				.audience(AUDIENCE)
				.claim("azp", AUTHORIZED_PARTY)
				.issueTime(Date.from(Instant.now()))
				.expirationTime(Date.from(Instant.now().plusSeconds(300)))
				.build();
		var token = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
		token.sign(new RSASSASigner(SIGNING_KEY.getPrivate()));
		return "Bearer " + token.serialize();
	}

	private static byte[] subscriptionEvent(String eventId, Instant eventCreatedAt) {
		return ("{\"id\":\"" + eventId + "\",\"type\":\"customer.subscription.updated\",\"created\":" + eventCreatedAt.getEpochSecond() + ",\"livemode\":false"
				+ ",\"data\":{\"object\":{\"id\":\"sub_endpoint\",\"customer\":\"cus_endpoint\",\"status\":\"active\",\"current_period_end\":"
				+ eventCreatedAt.plusSeconds(2_592_000).getEpochSecond() + "}}}").getBytes(StandardCharsets.UTF_8);
	}

	private static String signedHeader(byte[] payload) {
		var timestamp = Instant.now().getEpochSecond();
		return "t=" + timestamp + ",v1=" + hmac(timestamp + "." + new String(payload, StandardCharsets.UTF_8));
	}

	private static String hmac(String value) {
		try {
			var mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			return java.util.HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
		} catch (Exception exception) {
			throw new IllegalStateException(exception);
		}
	}

	private static KeyPair createKeyPair() {
		try {
			var generator = KeyPairGenerator.getInstance("RSA");
			generator.initialize(2048);
			return generator.generateKeyPair();
		} catch (Exception exception) {
			throw new IllegalStateException(exception);
		}
	}

	@TestConfiguration
	static class TestBillingConfiguration {
		@Bean
		@Primary
		JwtDecoder testJwtDecoder() {
			var decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) SIGNING_KEY.getPublic()).build();
			decoder.setJwtValidator(ClerkJwtValidator.create(ISSUER, AUDIENCE, AUTHORIZED_PARTY));
			return decoder;
		}

		@Bean
		@Primary
		BillingClient billingClient() {
			return new BillingClient() {
				@Override
				public String createCustomer(UUID userId, String idempotencyKey) {
					return "cus_endpoint";
				}

				@Override
				public BillingService.CheckoutSession createCheckoutSession(String stripeCustomerId, String idempotencyKey) {
					return new BillingService.CheckoutSession("cs_test", "https://checkout.stripe.test/cs_test");
				}

				@Override
				public BillingClient.StripeSubscription retrieveSubscription(String stripeSubscriptionId) {
					return new BillingClient.StripeSubscription("sub_endpoint", "cus_endpoint", "active", Instant.now().plusSeconds(2_592_000), false);
				}

				@Override
				public BillingService.PortalSession createCustomerPortalSession(String stripeCustomerId) {
					return new BillingService.PortalSession("https://billing.stripe.test/portal");
				}
			};
		}
	}
}
