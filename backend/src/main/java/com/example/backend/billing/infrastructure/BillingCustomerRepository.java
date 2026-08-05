package com.example.backend.billing.infrastructure;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

interface BillingCustomerRepository extends JpaRepository<BillingCustomerEntity, UUID> {
	Optional<BillingCustomerEntity> findByStripeCustomerId(String stripeCustomerId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select customer from BillingCustomerEntity customer where customer.userId = :userId")
	Optional<BillingCustomerEntity> findByUserIdForUpdate(UUID userId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select customer from BillingCustomerEntity customer where customer.stripeCustomerId = :stripeCustomerId")
	Optional<BillingCustomerEntity> findByStripeCustomerIdForUpdate(String stripeCustomerId);
}
