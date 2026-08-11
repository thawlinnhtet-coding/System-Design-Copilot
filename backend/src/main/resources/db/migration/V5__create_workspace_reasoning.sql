CREATE TABLE workspace_requirements (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    user_id UUID NOT NULL REFERENCES users(id),
    kind VARCHAR(32) NOT NULL,
    statement VARCHAR(2000) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    measurable_target VARCHAR(500),
    rationale VARCHAR(2000),
    source VARCHAR(500),
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX workspace_requirements_workspace_order_idx
    ON workspace_requirements (workspace_id, user_id, sort_order);

CREATE TABLE workspace_assumptions (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    user_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(64) NOT NULL,
    quantitative_value VARCHAR(500),
    unit VARCHAR(64),
    rationale VARCHAR(2000),
    confidence VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    source VARCHAR(500),
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX workspace_assumptions_workspace_order_idx
    ON workspace_assumptions (workspace_id, user_id, sort_order);

CREATE TABLE workspace_questions (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    user_id UUID NOT NULL REFERENCES users(id),
    question VARCHAR(2000) NOT NULL,
    why_it_matters VARCHAR(2000) NOT NULL,
    status VARCHAR(32) NOT NULL,
    resolution_notes VARCHAR(2000),
    related_requirement_ids TEXT NOT NULL,
    related_assumption_ids TEXT NOT NULL,
    resulting_decision_id UUID,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX workspace_questions_workspace_order_idx
    ON workspace_questions (workspace_id, user_id, sort_order);

CREATE TABLE workspace_decisions (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    chosen_option VARCHAR(1000) NOT NULL,
    rationale VARCHAR(2000) NOT NULL,
    alternatives VARCHAR(2000),
    positive_consequences VARCHAR(2000),
    risks VARCHAR(2000),
    status VARCHAR(32) NOT NULL,
    evidence_refs TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX workspace_decisions_workspace_order_idx
    ON workspace_decisions (workspace_id, user_id, sort_order);

CREATE TABLE workspace_review_briefs (
    workspace_id UUID PRIMARY KEY REFERENCES workspaces(id),
    user_id UUID NOT NULL REFERENCES users(id),
    system_description VARCHAR(4000) NOT NULL,
    review_goal VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
