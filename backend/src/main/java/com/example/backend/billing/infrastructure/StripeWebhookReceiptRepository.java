package com.example.backend.billing.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

interface StripeWebhookReceiptRepository extends JpaRepository<StripeWebhookReceiptEntity, String> {
}
