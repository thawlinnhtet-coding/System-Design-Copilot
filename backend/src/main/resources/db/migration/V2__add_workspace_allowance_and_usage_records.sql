ALTER TABLE users ADD COLUMN active_workspace_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE usage_records (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    operation VARCHAR(32) NOT NULL,
    operation_id UUID NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE UNIQUE INDEX usage_records_user_operation_operation_id_idx
    ON usage_records (user_id, operation, operation_id);

CREATE INDEX usage_records_user_operation_recorded_at_idx
    ON usage_records (user_id, operation, recorded_at);
