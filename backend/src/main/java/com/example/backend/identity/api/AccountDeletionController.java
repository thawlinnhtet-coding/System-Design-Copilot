package com.example.backend.identity.api;

import com.example.backend.identity.application.AccountDeletionExceptions.AccountDeletionNotFoundException;
import com.example.backend.identity.application.AccountDeletionExceptions.RecentAuthenticationRequiredException;
import com.example.backend.identity.application.AccountDeletionService;
import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.identity.application.VerifiedEmailPolicy;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/me/account-deletion")
@SecurityRequirement(name = "clerkBearerAuth")
public class AccountDeletionController {
	private final CurrentUserService currentUsers;
	private final AccountDeletionService service;
	private final VerifiedEmailPolicy verifiedEmailPolicy;
	private final com.example.backend.identity.application.AccountDeletionProperties properties;
	public AccountDeletionController(CurrentUserService currentUsers, AccountDeletionService service, VerifiedEmailPolicy verifiedEmailPolicy, com.example.backend.identity.application.AccountDeletionProperties properties) {
		this.currentUsers = currentUsers; this.service = service; this.verifiedEmailPolicy = verifiedEmailPolicy; this.properties = properties;
	}
	@GetMapping @Operation(summary = "Read the Account Deletion Request state")
	public AccountDeletionResponse status(@AuthenticationPrincipal Jwt jwt) {
		var user = currentUsers.getOrCreate(jwt.getSubject());
		return response(service.status(user.id()));
	}
	@PostMapping @ResponseStatus(HttpStatus.ACCEPTED) @Operation(summary = "Request reversible account deletion")
	public AccountDeletionResponse request(@AuthenticationPrincipal Jwt jwt) {
		requireRecentAuthentication(jwt);
		var email = verifiedEmailPolicy.verifiedEmail(jwt);
		var user = currentUsers.getOrCreate(jwt.getSubject());
		return response(service.request(user, email));
	}
	@PostMapping("/cancel") @ResponseStatus(HttpStatus.NO_CONTENT) @Operation(summary = "Cancel an Account Deletion Request")
	public void cancel(@AuthenticationPrincipal Jwt jwt, @RequestParam String token) { service.cancel(jwt.getSubject(), token); }
	private void requireRecentAuthentication(Jwt jwt) {
		var value = jwt.getClaim("fva");
		if (!(value instanceof java.util.List<?> ages) || ages.isEmpty()) throw new RecentAuthenticationRequiredException();
		try { if (Integer.parseInt(String.valueOf(ages.getFirst())) > properties.recentAuthenticationMinutes()) throw new RecentAuthenticationRequiredException(); }
		catch (NumberFormatException exception) { throw new RecentAuthenticationRequiredException(); }
	}
	private AccountDeletionResponse response(AccountDeletionService.DeletionStatus status) { return new AccountDeletionResponse(status.scheduled(), status.requestedAt(), status.recoveryEndsAt()); }
	public record AccountDeletionResponse(boolean scheduled, Instant requestedAt, Instant recoveryEndsAt) { }
}
