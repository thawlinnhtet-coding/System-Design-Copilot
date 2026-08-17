-- The beta no longer keeps a reversible deletion request. Existing pending markers are reset
-- before the old lifecycle schema is removed; users must explicitly confirm deletion again.
UPDATE users SET access_status = 'ACTIVE' WHERE access_status = 'DELETION_PENDING';
DROP TABLE IF EXISTS account_deletion_requests;
ALTER TABLE users DROP COLUMN IF EXISTS access_status;
