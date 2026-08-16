package com.example.backend.identity.application;

import java.util.Optional;
import java.util.UUID;

public interface CurrentUserStore {

	Optional<CurrentUserService.CurrentUser> findByClerkSubject(String clerkSubject);

	CurrentUserService.CurrentUser create(String clerkSubject);

	Optional<CurrentUserService.CurrentUser> findByIdIncludingSuspended(UUID userId);

	boolean isSuspended(UUID userId);

	void suspend(UUID userId);

	void restore(UUID userId);

	void delete(UUID userId);

}
