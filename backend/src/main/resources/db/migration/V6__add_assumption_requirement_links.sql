ALTER TABLE workspace_assumptions
    ADD COLUMN related_requirement_ids TEXT NOT NULL DEFAULT '[]';
