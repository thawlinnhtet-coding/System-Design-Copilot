CREATE TABLE ai_processing_consents (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL,
    policy_version VARCHAR(64) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL
);
