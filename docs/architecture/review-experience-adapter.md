# Review Experience adapter boundary

Issue #15 provides the Review reading and status shell before Issue #14 is merged. The shell intentionally makes no Review HTTP request and cannot submit, retry, poll, or load Review history by itself.

## Integration required from Issue #14

The authenticated API adapter must provide Workspace-scoped Review Request history, current status, immutable Architecture Revision metadata, completed output, linked evidence navigation, and retry for a retryable failure. The status values consumed by the shell are `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED_RETRYABLE`, and `FAILED_FINAL`.

The completed output must contain the seven separate rubric dimensions, interpretation, strengths, risks, Findings, uncertainty, and prioritized next actions. Findings may invoke a caller-owned navigation or manual carry action; the shell never mutates the Architecture Document or reasoning records automatically.

Retry must target the same immutable Architecture Revision. The #14 API remains authoritative for authorization, idempotency, usage, retry eligibility, and failure classification.

## Deliberately unavailable before #14

- Review submission and immutable checkpoint creation
- Status polling or completion notifications
- Persisted Review history and comparison data
- Retry execution
- Evidence routing and manual carry commands

The integrated workspace therefore renders an explicit unavailable state until the #14 generated OpenAPI contract and authenticated client methods are present.
