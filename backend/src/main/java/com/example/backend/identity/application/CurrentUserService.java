package com.example.backend.identity.application;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CurrentUserService {

	private final CurrentUserStore currentUserStore;

	public CurrentUserService(CurrentUserStore currentUserStore) {
		this.currentUserStore = currentUserStore;
	}

	public CurrentUser getOrCreate(String clerkSubject) {
		var existingUser = currentUserStore.findByClerkSubject(clerkSubject);
		if (existingUser.isPresent()) {
			return existingUser.get();
		}

		try {
			return currentUserStore.create(clerkSubject);
		} catch (DataIntegrityViolationException exception) {
			return currentUserStore.findByClerkSubject(clerkSubject)
					.orElseThrow(() -> new IllegalStateException("User creation conflicted without a persisted User", exception));
		}
	}

	public record CurrentUser(UUID id, String clerkSubject) {
	}

}
