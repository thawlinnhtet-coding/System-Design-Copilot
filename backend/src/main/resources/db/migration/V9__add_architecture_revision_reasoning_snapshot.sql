ALTER TABLE architecture_revisions
    ADD COLUMN reasoning_context JSONB NOT NULL DEFAULT '{}'::jsonb;
