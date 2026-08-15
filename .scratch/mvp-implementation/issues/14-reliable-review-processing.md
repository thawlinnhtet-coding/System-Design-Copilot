# 14 - Reliable Review Processing

**What to build:** An entitled User can request an asynchronous evidence-grounded Review of one immutable Architecture Revision, with durable and idempotent processing.

**Blocked by:** 03 - Free Plan And Usage Policy; 06 - Workspace Reasoning; 07 - Architecture Document Contract; 09 - Curated Challenge Catalog; 11 - AI Consent And Provider Boundary.

**Status:** complete

- [x] Submission atomically creates a Revision, Review Request, durable job state, and outbox event.
- [x] RabbitMQ duplicate delivery, worker failure, retry exhaustion, and broker interruption cannot duplicate completed Reviews or Usage Records.
- [x] Structured Review output validates scores, evidence, findings, uncertainty, and limits before persistence.
- [x] Malformed or unsupported Review output is rejected before it can appear as Completed and is classified as retryable or final without duplicate monthly usage.
- [x] PostgreSQL remains Review status authority; RabbitMQ delivery is at-least-once, consumers are idempotent, retries are bounded, and exhausted work is dead-lettered.

## Comments

- Completed with a PostgreSQL-backed Review Request, Job, Outbox Event, and Review lifecycle; RabbitMQ remains delivery-only. Review completion and usage recording are idempotent and transactional.
- Verified with `mvn.cmd verify` (102 tests).
