ALTER TABLE users ADD COLUMN access_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE account_deletion_requests (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    cancellation_token_hash BYTEA NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recovery_ends_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX account_deletion_requests_recovery_ends_at_idx ON account_deletion_requests (recovery_ends_at);

-- The tombstone is intentionally unlinkable: it supports operational replay counting without retaining identity or content.
CREATE TABLE account_deletion_tombstones (
    id UUID PRIMARY KEY,
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE usage_records DROP CONSTRAINT IF EXISTS usage_records_user_id_fkey;
ALTER TABLE usage_records ADD CONSTRAINT usage_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE billing_customers DROP CONSTRAINT IF EXISTS billing_customers_user_id_fkey;
ALTER TABLE billing_customers ADD CONSTRAINT billing_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE stripe_subscription_projections DROP CONSTRAINT IF EXISTS stripe_subscription_projections_user_id_fkey;
ALTER TABLE stripe_subscription_projections ADD CONSTRAINT stripe_subscription_projections_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_user_id_fkey;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE review_requests DROP CONSTRAINT IF EXISTS review_requests_user_id_fkey;
ALTER TABLE review_requests ADD CONSTRAINT review_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE review_requests DROP CONSTRAINT IF EXISTS review_requests_workspace_id_fkey;
ALTER TABLE review_requests ADD CONSTRAINT review_requests_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE review_jobs DROP CONSTRAINT IF EXISTS review_jobs_review_request_id_fkey;
ALTER TABLE review_jobs ADD CONSTRAINT review_jobs_review_request_id_fkey FOREIGN KEY (review_request_id) REFERENCES review_requests(id) ON DELETE CASCADE;
ALTER TABLE review_outbox_events DROP CONSTRAINT IF EXISTS review_outbox_events_review_job_id_fkey;
ALTER TABLE review_outbox_events ADD CONSTRAINT review_outbox_events_review_job_id_fkey FOREIGN KEY (review_job_id) REFERENCES review_jobs(id) ON DELETE CASCADE;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_review_request_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_review_request_id_fkey FOREIGN KEY (review_request_id) REFERENCES review_requests(id) ON DELETE CASCADE;
