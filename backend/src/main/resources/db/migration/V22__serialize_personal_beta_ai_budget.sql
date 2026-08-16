CREATE TABLE ai_daily_budget_guard (
    id SMALLINT PRIMARY KEY,
    CONSTRAINT ai_daily_budget_guard_singleton CHECK (id = 1)
);

INSERT INTO ai_daily_budget_guard (id) VALUES (1);
