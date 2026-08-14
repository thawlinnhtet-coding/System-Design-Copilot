CREATE TABLE challenges (
    id UUID PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    topic VARCHAR(120) NOT NULL,
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE challenge_versions (
    id UUID PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES challenges(id),
    version INTEGER NOT NULL,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    problem_statement VARCHAR(8000) NOT NULL,
    difficulty VARCHAR(16) NOT NULL,
    estimated_minutes INTEGER NOT NULL,
    topic_packs JSONB NOT NULL,
    initial_constraints JSONB NOT NULL,
    skill_coverage JSONB NOT NULL,
    scenario_preview JSONB NOT NULL,
    status VARCHAR(16) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT challenge_versions_unique_version UNIQUE (challenge_id, version),
    CONSTRAINT challenge_versions_estimated_minutes_positive CHECK (estimated_minutes > 0)
);

CREATE INDEX challenge_versions_challenge_status_version_idx ON challenge_versions (challenge_id, status, version DESC);

ALTER TABLE workspaces ADD COLUMN challenge_version_id UUID REFERENCES challenge_versions(id);
CREATE INDEX workspaces_challenge_version_idx ON workspaces (challenge_version_id);

INSERT INTO challenges (id, slug, topic, status, created_at) VALUES
    ('11111111-1111-4111-8111-111111111111', 'url-shortener', 'Request paths and data/read scaling', 'PUBLISHED', CURRENT_TIMESTAMP),
    ('22222222-2222-4222-8222-222222222222', 'news-feed', 'Data/read scaling and async/eventing', 'PUBLISHED', CURRENT_TIMESTAMP),
    ('33333333-3333-4333-8333-333333333333', 'ticket-booking', 'Consistency/contention and reliability/operations', 'PUBLISHED', CURRENT_TIMESTAMP);

INSERT INTO challenge_versions (id, challenge_id, version, title, description, problem_statement, difficulty, estimated_minutes, topic_packs, initial_constraints, skill_coverage, scenario_preview, status, published_at) VALUES
    ('11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 1, 'Design a reliable URL shortener', 'Handle 100M redirects per day while keeping reads fast and links durable.', 'Design a URL shortener that accepts a long URL, returns a compact link, and redirects users reliably under a read-heavy workload. Explain the dominant request path, identifier strategy, storage model, and failure behavior.', 'FOUNDATION', 30, '["request paths", "data/read scaling", "consistency/contention", "async/eventing", "reliability/operations", "global/multi-region systems"]', '["100M redirects per day", "p99 redirect latency under 120 ms", "Links must remain valid for five years"]', '[{"name":"request-path decomposition","level":"introduce","primary":true,"reviewDimension":"requirements"},{"name":"data modeling","level":"practice","primary":false,"reviewDimension":"data modeling"},{"name":"availability trade-offs","level":"practice","primary":false,"reviewDimension":"reliability"}]', '["Traffic grows 10x over one quarter", "The primary persistence region becomes unavailable", "A malicious client creates high-volume redirect traffic"]', 'PUBLISHED', CURRENT_TIMESTAMP),
('22222222-2222-4222-8222-222222222223', '22222222-2222-4222-8222-222222222222', 1, 'Design a resilient news feed', 'Serve a personalized, read-heavy feed while balancing freshness, fan-out, and recovery.', 'Design a personalized news feed for a read-heavy product. Explain how posts are written, how followers read a feed, how fan-out is controlled, and how the system handles freshness, worker lag, and privacy changes.', 'INTERMEDIATE', 60, '["request paths", "data/read scaling", "consistency/contention", "async/eventing", "reliability/operations", "global/multi-region systems"]', '["Read traffic is 100:1 over writes", "A user may follow 10,000 accounts", "New posts should normally appear within 30 seconds"]', '[{"name":"read/write scaling","level":"practice","primary":true,"reviewDimension":"scaling"},{"name":"async fan-out","level":"practice","primary":false,"reviewDimension":"async reasoning"},{"name":"freshness and consistency","level":"demonstrate","primary":false,"reviewDimension":"consistency"}]', '["A celebrity post creates a read surge", "Feed workers fall behind for ten minutes", "A post changes visibility after fan-out"]', 'PUBLISHED', CURRENT_TIMESTAMP),
('33333333-3333-4333-8333-333333333334', '33333333-3333-4333-8333-333333333333', 1, 'Design a safe ticket-booking system', 'Protect scarce inventory during demand spikes without making successful reservations ambiguous.', 'Design a ticket-booking system that prevents overselling during a flash sale. Explain inventory ownership, reservation and hold expiry, payment failure, retries, cancellation, and reconciliation when external systems disagree.', 'ADVANCED', 90, '["request paths", "data/read scaling", "consistency/contention", "async/eventing", "reliability/operations", "global/multi-region systems"]', '["Inventory cannot be oversold", "A hold expires after 10 minutes", "Payment providers may timeout after charging a customer"]', '[{"name":"contention control","level":"practice","primary":true,"reviewDimension":"consistency"},{"name":"workflow recovery","level":"demonstrate","primary":false,"reviewDimension":"reliability"},{"name":"idempotency","level":"demonstrate","primary":false,"reviewDimension":"async reasoning"}]', '["A flash sale causes extreme contention", "Payment succeeds but the booking response times out", "Hold expiry races with cancellation and refund"]', 'PUBLISHED', CURRENT_TIMESTAMP);
