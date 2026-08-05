package com.example.backend.billing.application;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;

@Component
class StripeSignatureVerifier {

	private final BillingProperties properties;
	private final Clock clock;

	StripeSignatureVerifier(BillingProperties properties, Clock clock) {
		this.properties = properties;
		this.clock = clock;
	}

	boolean isValid(byte[] payload, String header) {
		if (header == null || properties.stripeWebhookSecret() == null || properties.stripeWebhookSecret().isBlank()) {
			return false;
		}

		Long timestamp = null;
		var signatures = new ArrayList<String>();
		for (var part : header.split(",")) {
			var pair = part.trim().split("=", 2);
			if (pair.length != 2) {
				continue;
			}
			if (pair[0].equals("t")) {
				try {
					timestamp = Long.parseLong(pair[1]);
				} catch (NumberFormatException ignored) {
					return false;
				}
			} else if (pair[0].equals("v1")) {
				signatures.add(pair[1]);
			}
		}
		if (timestamp == null || signatures.isEmpty()
				|| Math.abs(Instant.now(clock).getEpochSecond() - timestamp) > properties.webhookToleranceSeconds()) {
			return false;
		}

		var prefix = (timestamp + ".").getBytes(StandardCharsets.UTF_8);
		var signedPayload = new byte[prefix.length + payload.length];
		System.arraycopy(prefix, 0, signedPayload, 0, prefix.length);
		System.arraycopy(payload, 0, signedPayload, prefix.length, payload.length);
		var expected = hmac(signedPayload);
		return signatures.stream().anyMatch(signature -> MessageDigest.isEqual(
				expected.getBytes(StandardCharsets.US_ASCII), signature.getBytes(StandardCharsets.US_ASCII)));
	}

	private String hmac(byte[] signedPayload) {
		try {
			var mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(properties.stripeWebhookSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			return java.util.HexFormat.of().formatHex(mac.doFinal(signedPayload));
		} catch (Exception exception) {
			throw new IllegalStateException("Unable to verify Stripe webhook signature", exception);
		}
	}
}
