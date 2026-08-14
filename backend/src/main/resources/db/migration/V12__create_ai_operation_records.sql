CREATE TABLE ai_operation_records (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    profile VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL,
    model VARCHAR(255),
    provider_request_id VARCHAR(255),
    prompt_version VARCHAR(64) NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    estimated_cost_usd NUMERIC(12, 6) NOT NULL,
    charged_cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
    latency_ms BIGINT,
    outcome_code VARCHAR(64),
    accepted_output TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ai_operation_records_costs_nonnegative CHECK (
        estimated_cost_usd >= 0 AND charged_cost_usd >= 0
    )
);

CREATE INDEX ai_operation_records_user_created_at_idx
    ON ai_operation_records (user_id, created_at);
