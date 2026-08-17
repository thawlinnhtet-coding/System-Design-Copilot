ALTER TABLE review_outbox_events
    ADD COLUMN lease_owner VARCHAR(128),
    ADD COLUMN lease_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX review_outbox_events_claim_idx
    ON review_outbox_events(status, lease_expires_at, created_at);
