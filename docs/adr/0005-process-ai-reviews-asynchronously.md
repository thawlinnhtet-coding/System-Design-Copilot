---
status: accepted
date: 2026-08-02
---

# Process AI Reviews Asynchronously With RabbitMQ And A Transactional Outbox

Accept a Review Request by atomically creating an immutable Architecture Revision, durable Review job, and PostgreSQL outbox event. Publish the event to RabbitMQ after commit and process it with an idempotent consumer using bounded retries and dead-letter routing. PostgreSQL, not RabbitMQ, remains the source of Review Request status; a Review exists only after successful completion.

## Considered Options

- Hold the Review HTTP request open until the model completes.
- Start an in-process asynchronous task after returning from the API.
- Publish directly to RabbitMQ inside the request transaction.
- Persist a job and outbox event, then deliver through RabbitMQ.

Synchronous calls are vulnerable to provider and platform timeouts. In-process tasks are lost on restart. Direct publication creates a database-message dual-write gap. The outbox closes the acceptance gap while RabbitMQ provides back-pressure and retry delivery.

## Consequences

- Consumers must tolerate at-least-once delivery, use stable message and job identifiers, and claim work through renewable time-bounded database leases.
- Messages carry identifiers and versions rather than private architecture payloads.
- Review Request status transitions, completed Reviews, and Usage Records must be transactional and idempotent.
- The system requires an outbox publisher, retry policy, dead-letter operations, and queue observability.
- Interactive Copilot Turns may still use a short synchronous or streaming path because they have different latency and UX needs.
