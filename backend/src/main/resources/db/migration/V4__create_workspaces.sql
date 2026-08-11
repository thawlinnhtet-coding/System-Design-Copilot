CREATE TABLE workspaces (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(120) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    source VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    save_state VARCHAR(32) NOT NULL DEFAULT 'NOT_STARTED',
    latest_review_state VARCHAR(32) NOT NULL DEFAULT 'NOT_REQUESTED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT workspaces_progress_percent_range CHECK (progress_percent BETWEEN 0 AND 100)
);

CREATE INDEX workspaces_user_status_updated_at_idx
    ON workspaces (user_id, status, updated_at DESC);
