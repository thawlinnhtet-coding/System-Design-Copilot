package com.example.backend.identity.infrastructure;

import com.example.backend.identity.application.CurrentUserService;
import com.example.backend.identity.application.CurrentUserStore;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
class JpaCurrentUserStore implements CurrentUserStore {

	private final UserRepository userRepository;

	JpaCurrentUserStore(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	@Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
	public Optional<CurrentUserService.CurrentUser> findByClerkSubject(String clerkSubject) {
		return userRepository.findByClerkSubject(clerkSubject)
				.map(user -> new CurrentUserService.CurrentUser(user.getId(), user.getClerkSubject()));
	}

	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public CurrentUserService.CurrentUser create(String clerkSubject) {
		var user = userRepository.saveAndFlush(new UserEntity(clerkSubject));
		return new CurrentUserService.CurrentUser(user.getId(), user.getClerkSubject());
	}

}
