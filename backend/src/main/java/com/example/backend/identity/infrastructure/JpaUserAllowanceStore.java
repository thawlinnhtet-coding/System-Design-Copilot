package com.example.backend.identity.infrastructure;

import com.example.backend.entitlement.application.UserAllowanceStore;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
class JpaUserAllowanceStore implements UserAllowanceStore {

	private final UserRepository userRepository;

	JpaUserAllowanceStore(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public int activeWorkspaceCount(UUID userId) {
		return userRepository.findById(userId)
				.map(UserEntity::getActiveWorkspaceCount)
				.orElseThrow(() -> new IllegalArgumentException("User does not exist"));
	}

	@Override
	public int activeWorkspaceCountForUpdate(UUID userId) {
		return userRepository.findByIdForUpdate(userId)
				.map(UserEntity::getActiveWorkspaceCount)
				.orElseThrow(() -> new IllegalArgumentException("User does not exist"));
	}

	@Override
	public void updateActiveWorkspaceCount(UUID userId, int activeWorkspaceCount) {
		var user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User does not exist"));
		user.setActiveWorkspaceCount(activeWorkspaceCount);
	}

}
