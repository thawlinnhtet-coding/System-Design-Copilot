package com.example.backend.entitlement.api;

import com.example.backend.entitlement.application.EntitlementService;
import com.example.backend.identity.application.CurrentUserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/usage")
@SecurityRequirement(name = "clerkBearerAuth")
public class EntitlementsController {

	private final CurrentUserService currentUserService;
	private final EntitlementService entitlementService;

	public EntitlementsController(CurrentUserService currentUserService, EntitlementService entitlementService) {
		this.currentUserService = currentUserService;
		this.entitlementService = entitlementService;
	}

	@GetMapping
	public EntitlementService.CurrentEntitlements currentEntitlements(@AuthenticationPrincipal Jwt jwt) {
		var user = currentUserService.getOrCreate(jwt.getSubject());
		return entitlementService.currentEntitlements(user.id());
	}

}
