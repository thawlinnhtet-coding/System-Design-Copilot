CREATE TABLE billing_customers (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    clerk_subject VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL UNIQUE,
    last_checkout_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE stripe_subscription_projections (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE,
    past_due_at TIMESTAMP WITH TIME ZONE,
    last_event_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_event_id VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX stripe_subscription_projections_customer_idx
    ON stripe_subscription_projections (stripe_customer_id);

CREATE TABLE stripe_webhook_receipts (
    stripe_event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    event_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL
);
