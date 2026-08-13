package com.example.backend.billing.api;

import com.example.backend.billing.application.BillingService;
import com.example.backend.billing.application.InvalidBillingRequestException;
import com.example.backend.identity.application.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class BillingController {

	private final CurrentUserService currentUserService;
	private final BillingService billingService;

	public BillingController(CurrentUserService currentUserService, BillingService billingService) {
		this.currentUserService = currentUserService;
		this.billingService = billingService;
	}

	@PostMapping("/billing/checkout")
	@Operation(summary = "Create a Stripe Checkout session")
	@SecurityRequirement(name = "clerkBearerAuth")
	public BillingService.CheckoutSession checkout(
			@AuthenticationPrincipal Jwt jwt,
			@Parameter(in = ParameterIn.HEADER, required = true, description = "Caller-generated idempotency key")
			@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
	) {
		if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 255) {
			throw new InvalidBillingRequestException();
		}
		return billingService.startCheckout(currentUserService.getOrCreate(jwt.getSubject()), idempotencyKey);
	}

	@PostMapping("/billing/portal")
	@Operation(summary = "Create a Stripe Customer Portal session")
	@SecurityRequirement(name = "clerkBearerAuth")
	public BillingService.PortalSession customerPortal(@AuthenticationPrincipal Jwt jwt) {
		return billingService.startCustomerPortal(currentUserService.getOrCreate(jwt.getSubject()));
	}

	@PostMapping("/billing/checkout/complete")
	@Operation(summary = "Reconcile a completed Stripe Checkout session for the signed-in user")
	@SecurityRequirement(name = "clerkBearerAuth")
	public void completeCheckout(@AuthenticationPrincipal Jwt jwt, @RequestParam("session_id") String sessionId, HttpServletResponse response) {
		billingService.reconcileCompletedCheckout(currentUserService.getOrCreate(jwt.getSubject()), sessionId);
		response.setStatus(HttpServletResponse.SC_NO_CONTENT);
	}

	@PostMapping(value = "/webhooks/stripe", consumes = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Receive a signed Stripe webhook")
	@ApiResponse(responseCode = "204", description = "Stripe event accepted")
	public void stripeWebhook(
			@RequestBody byte[] rawBody,
			@RequestHeader(value = "Stripe-Signature", required = false) String stripeSignature,
			HttpServletResponse response
	) {
		billingService.processWebhook(rawBody, stripeSignature);
		response.setStatus(HttpServletResponse.SC_NO_CONTENT);
	}
}
