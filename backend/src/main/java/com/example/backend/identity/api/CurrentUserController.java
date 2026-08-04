package com.example.backend.identity.api;

import com.example.backend.identity.application.CurrentUserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me")
@SecurityRequirement(name = "clerkBearerAuth")
public class CurrentUserController {

	private final CurrentUserService currentUserService;

	public CurrentUserController(CurrentUserService currentUserService) {
		this.currentUserService = currentUserService;
	}

	@GetMapping
	public CurrentUserResponse currentUser(@AuthenticationPrincipal Jwt jwt) {
		var user = currentUserService.getOrCreate(jwt.getSubject());
		return new CurrentUserResponse(user.id(), user.clerkSubject());
	}

	public record CurrentUserResponse(UUID id, String clerkSubject) {
	}

}
