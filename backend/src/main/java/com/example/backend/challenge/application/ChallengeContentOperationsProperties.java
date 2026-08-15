package com.example.backend.challenge.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties("app.content-operations")
public record ChallengeContentOperationsProperties(List<String> authorizedClerkSubjects) {
	public boolean isAuthorized(String clerkSubject) {
		return authorizedClerkSubjects != null && authorizedClerkSubjects.contains(clerkSubject);
	}
}
