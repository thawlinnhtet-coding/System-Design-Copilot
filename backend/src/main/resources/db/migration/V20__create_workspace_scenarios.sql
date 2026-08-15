CREATE TABLE workspace_scenarios (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    source VARCHAR(32) NOT NULL,
    order_index INTEGER NOT NULL,
    title VARCHAR(160) NOT NULL,
    changed_condition VARCHAR(1000) NOT NULL,
    details VARCHAR(4000) NOT NULL,
    category VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    response VARCHAR(8000),
    architecture_changes VARCHAR(4000),
    decision_changes VARCHAR(4000),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT workspace_scenarios_workspace_order_unique UNIQUE (workspace_id, order_index)
);

CREATE INDEX workspace_scenarios_workspace_user_order_idx ON workspace_scenarios (workspace_id, user_id, order_index);
