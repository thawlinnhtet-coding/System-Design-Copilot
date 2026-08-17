package com.example.backend.identity.application;

import java.util.Optional;
import java.util.UUID;

public interface CurrentUserStore {

	Optional<CurrentUserService.CurrentUser> findByClerkSubject(String clerkSubject);

	CurrentUserService.CurrentUser create(String clerkSubject);

	void delete(UUID userId);

}
