ALTER TABLE workspace_requirements
    DROP CONSTRAINT IF EXISTS workspace_requirements_workspace_id_fkey;
ALTER TABLE workspace_requirements
    ADD CONSTRAINT workspace_requirements_workspace_id_fkey
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE workspace_assumptions
    DROP CONSTRAINT IF EXISTS workspace_assumptions_workspace_id_fkey;
ALTER TABLE workspace_assumptions
    ADD CONSTRAINT workspace_assumptions_workspace_id_fkey
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE workspace_questions
    DROP CONSTRAINT IF EXISTS workspace_questions_workspace_id_fkey;
ALTER TABLE workspace_questions
    ADD CONSTRAINT workspace_questions_workspace_id_fkey
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE workspace_decisions
    DROP CONSTRAINT IF EXISTS workspace_decisions_workspace_id_fkey;
ALTER TABLE workspace_decisions
    ADD CONSTRAINT workspace_decisions_workspace_id_fkey
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE workspace_review_briefs
    DROP CONSTRAINT IF EXISTS workspace_review_briefs_workspace_id_fkey;
ALTER TABLE workspace_review_briefs
    ADD CONSTRAINT workspace_review_briefs_workspace_id_fkey
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
