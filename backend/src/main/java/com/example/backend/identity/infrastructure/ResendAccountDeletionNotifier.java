package com.example.backend.identity.infrastructure;

import com.example.backend.identity.application.AccountDeletionNotifier;
import com.example.backend.identity.application.AccountDeletionProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Component
class ResendAccountDeletionNotifier implements AccountDeletionNotifier {
	private final AccountDeletionProperties properties;
	private final ObjectMapper json = new ObjectMapper();
	private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
	ResendAccountDeletionNotifier(AccountDeletionProperties properties) { this.properties = properties; }
	public void sendCancellationLink(String verifiedEmail, String cancellationToken, Instant recoveryEndsAt) {
		if (properties.resendApiKey() == null || properties.resendApiKey().isBlank() || properties.resendFromEmail() == null || properties.resendFromEmail().isBlank()) throw new AccountDeletionProviderException();
		try {
			var link = properties.cancellationBaseUrl() + "?token=" + java.net.URLEncoder.encode(cancellationToken, java.nio.charset.StandardCharsets.UTF_8);
			var deadline = DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneOffset.UTC).format(recoveryEndsAt);
			var body = json.writeValueAsString(Map.of("from", properties.resendFromEmail(), "to", java.util.List.of(verifiedEmail),
					"subject", "Cancel your System Design Copilot account deletion", "text", "Your account deletion is scheduled. Sign in, then cancel before " + deadline + ": " + link));
			var request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails")).timeout(Duration.ofSeconds(20))
					.header("Authorization", "Bearer " + properties.resendApiKey()).header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString(body)).build();
			var response = client.send(request, HttpResponse.BodyHandlers.discarding());
			if (response.statusCode() < 200 || response.statusCode() >= 300) throw new AccountDeletionProviderException();
		} catch (AccountDeletionProviderException exception) { throw exception; }
		catch (Exception exception) { throw new AccountDeletionProviderException(); }
	}
}
