ALTER TABLE workspaces ADD COLUMN workspace_type VARCHAR(32);

UPDATE workspaces
SET workspace_type = 'CUSTOM_DESIGN',
    source = 'CUSTOM_DESIGN'
WHERE source = 'CUSTOM';

ALTER TABLE workspaces ALTER COLUMN workspace_type SET NOT NULL;

ALTER TABLE workspaces
    ADD CONSTRAINT workspaces_type_source_check CHECK (
        (workspace_type = 'CHALLENGE' AND source = 'CURATED_CHALLENGE') OR
        (workspace_type = 'CUSTOM_DESIGN' AND source = 'CUSTOM_DESIGN') OR
        (workspace_type = 'ARCHITECTURE_REVIEW' AND source IN ('IMPORT_PACKAGE', 'MANUAL_RECREATION'))
    );
