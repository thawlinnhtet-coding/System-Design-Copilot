# 14 - Reliable Review Processing

**What to build:** An entitled User can request an asynchronous evidence-grounded Review of one immutable Architecture Revision, with durable and idempotent processing.

**Blocked by:** 03 - Free Plan And Usage Policy; 06 - Workspace Reasoning; 07 - Architecture Document Contract; 09 - Curated Challenge Catalog; 11 - AI Consent And Provider Boundary.

**Status:** ready-for-agent

- [ ] Submission atomically creates a Revision, Review Request, durable job state, and outbox event.
- [ ] RabbitMQ duplicate delivery, worker failure, retry exhaustion, and broker interruption cannot duplicate completed Reviews or Usage Records.
- [ ] Structured Review output validates scores, evidence, findings, uncertainty, and limits before persistence.
- [ ] Malformed or unsupported Review output is rejected before it can appear as Completed and is classified as retryable or final without duplicate monthly usage.
- [ ] PostgreSQL remains Review status authority; RabbitMQ delivery is at-least-once, consumers are idempotent, retries are bounded, and exhausted work is dead-lettered.
