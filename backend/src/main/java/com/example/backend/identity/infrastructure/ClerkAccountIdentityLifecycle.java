package com.example.backend.identity.infrastructure;

import com.example.backend.identity.application.AccountDeletionProperties;
import com.example.backend.identity.application.AccountIdentityLifecycle;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
class ClerkAccountIdentityLifecycle implements AccountIdentityLifecycle {
	private final AccountDeletionProperties properties;
	private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
	ClerkAccountIdentityLifecycle(AccountDeletionProperties properties) { this.properties = properties; }
	public void deleteUser(String clerkSubject) { call("users/" + clerkSubject, "DELETE"); }
	private void call(String path, String method) {
		if (properties.clerkSecretKey() == null || properties.clerkSecretKey().isBlank()) throw new AccountDeletionProviderException();
		try {
			var request = HttpRequest.newBuilder(URI.create(properties.clerkApiBaseUrl()).resolve(path)).timeout(Duration.ofSeconds(20))
					.header("Authorization", "Bearer " + properties.clerkSecretKey())
					.method(method, HttpRequest.BodyPublishers.noBody()).build();
			var response = client.send(request, HttpResponse.BodyHandlers.discarding());
			if (response.statusCode() < 200 || response.statusCode() >= 300) throw new AccountDeletionProviderException();
		} catch (AccountDeletionProviderException exception) { throw exception; }
		catch (Exception exception) { throw new AccountDeletionProviderException(); }
	}
}
