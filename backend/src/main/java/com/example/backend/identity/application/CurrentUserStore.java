package com.example.backend.identity.application;

import java.util.Optional;

public interface CurrentUserStore {

	Optional<CurrentUserService.CurrentUser> findByClerkSubject(String clerkSubject);

	CurrentUserService.CurrentUser create(String clerkSubject);

}
