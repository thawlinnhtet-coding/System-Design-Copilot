package com.example.backend.identity.api;

import com.example.backend.identity.application.AccountDeletionService;
import com.example.backend.identity.application.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/me/account-deletion")
@SecurityRequirement(name = "clerkBearerAuth")
public class AccountDeletionController {
	private final CurrentUserService currentUsers;
	private final AccountDeletionService service;
	public AccountDeletionController(CurrentUserService currentUsers, AccountDeletionService service) {
		this.currentUsers = currentUsers; this.service = service;
	}
	@PostMapping @ResponseStatus(HttpStatus.NO_CONTENT) @Operation(summary = "Permanently delete the account after explicit confirmation")
	public void request(@AuthenticationPrincipal Jwt jwt) {
		var user = currentUsers.getOrCreate(jwt.getSubject());
		service.delete(user);
	}
}
