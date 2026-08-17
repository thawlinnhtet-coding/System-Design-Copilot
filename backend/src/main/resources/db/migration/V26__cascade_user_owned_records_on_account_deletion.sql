-- Immediate account deletion must remove every record owned directly by the user.
ALTER TABLE architecture_revisions DROP CONSTRAINT IF EXISTS architecture_revisions_user_id_fkey;
ALTER TABLE architecture_revisions ADD CONSTRAINT architecture_revisions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_architecture_documents DROP CONSTRAINT IF EXISTS workspace_architecture_documents_user_id_fkey;
ALTER TABLE workspace_architecture_documents ADD CONSTRAINT workspace_architecture_documents_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_assumptions DROP CONSTRAINT IF EXISTS workspace_assumptions_user_id_fkey;
ALTER TABLE workspace_assumptions ADD CONSTRAINT workspace_assumptions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_decisions DROP CONSTRAINT IF EXISTS workspace_decisions_user_id_fkey;
ALTER TABLE workspace_decisions ADD CONSTRAINT workspace_decisions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_questions DROP CONSTRAINT IF EXISTS workspace_questions_user_id_fkey;
ALTER TABLE workspace_questions ADD CONSTRAINT workspace_questions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_requirements DROP CONSTRAINT IF EXISTS workspace_requirements_user_id_fkey;
ALTER TABLE workspace_requirements ADD CONSTRAINT workspace_requirements_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_review_briefs DROP CONSTRAINT IF EXISTS workspace_review_briefs_user_id_fkey;
ALTER TABLE workspace_review_briefs ADD CONSTRAINT workspace_review_briefs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_scenarios DROP CONSTRAINT IF EXISTS workspace_scenarios_user_id_fkey;
ALTER TABLE workspace_scenarios ADD CONSTRAINT workspace_scenarios_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
