CREATE TABLE workspace_architecture_documents (
    workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    version BIGINT NOT NULL,
    document JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT workspace_architecture_documents_version_positive CHECK (version >= 0)
);

CREATE TABLE architecture_revisions (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    document_version BIGINT NOT NULL,
    document JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX architecture_revisions_workspace_created_at_idx
    ON architecture_revisions (workspace_id, created_at DESC);
