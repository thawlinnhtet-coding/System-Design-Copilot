---
status: accepted
date: 2026-08-02
---

# Persist Schema-Versioned Architecture Documents And Immutable Revisions

Store each mutable Architecture Document as validated, schema-versioned JSONB in PostgreSQL, while storing searchable business concepts such as Requirements, Decisions, Reviews, and Findings relationally. Create an immutable Architecture Revision whenever a Review is submitted, and make the Review reference that Revision.

## Considered Options

- Store every node and edge property in normalized relational tables.
- Store the whole Workspace, including Reviews and identity data, as one document.
- Event-source every canvas edit.
- Use a hybrid JSONB document with relational business records and checkpoint Revisions.

React Flow documents evolve and are loaded and saved as a unit, making full normalization costly and rigid. A single aggregate document would weaken relational integrity and querying for core product records. Event sourcing adds complexity and unbounded history that the MVP explicitly excludes. The hybrid model preserves editor flexibility and durable business invariants.

## Consequences

- Every released document schema version needs validation and an explicit migration path.
- Imports accept portable design content only and cannot provide ownership, billing, Review, or provider state.
- Autosave uses optimistic concurrency on the mutable document.
- Existing Revisions and Reviews never change after later edits.
- PostgreSQL remains the only durable database required by the MVP.
