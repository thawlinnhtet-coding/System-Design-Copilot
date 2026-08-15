CREATE TABLE review_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    revision_id UUID NOT NULL REFERENCES architecture_revisions(id),
    idempotency_key VARCHAR(255) NOT NULL,
    request_fingerprint VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    error_code VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX review_requests_user_idempotency_key_idx ON review_requests(user_id, idempotency_key);
CREATE UNIQUE INDEX review_requests_revision_idx ON review_requests(revision_id);

CREATE TABLE review_jobs (
    id UUID PRIMARY KEY,
    review_request_id UUID NOT NULL UNIQUE REFERENCES review_requests(id),
    status VARCHAR(32) NOT NULL,
    attempts INTEGER NOT NULL,
    max_attempts INTEGER NOT NULL,
    lease_owner VARCHAR(128),
    lease_expires_at TIMESTAMP WITH TIME ZONE,
    last_failure_code VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX review_jobs_status_lease_idx ON review_jobs(status, lease_expires_at);

CREATE TABLE review_outbox_events (
    id UUID PRIMARY KEY,
    review_job_id UUID NOT NULL UNIQUE REFERENCES review_jobs(id),
    event_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX review_outbox_events_status_idx ON review_outbox_events(status, created_at);

CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    review_request_id UUID NOT NULL UNIQUE REFERENCES review_requests(id),
    revision_id UUID NOT NULL UNIQUE REFERENCES architecture_revisions(id),
    output JSONB NOT NULL,
    model VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
