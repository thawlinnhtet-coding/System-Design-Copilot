---
status: accepted
date: 2026-08-02
---

# Use A Monorepo

Keep the Next.js frontend, Spring Boot backend, infrastructure definitions, product documents, OpenAPI contract workflow, and architecture decisions in one repository. The applications remain independently buildable and deployable, but cross-application changes can be reviewed and validated together.

## Considered Options

- Separate repositories for frontend, backend, and infrastructure.
- A monorepo with independently owned application roots.

Separate repositories provide stronger administrative isolation but add contract coordination, duplicated automation, and documentation drift before separate teams exist. A monorepo better fits the initial team and frequency of end-to-end product changes.

## Consequences

- Root rules and automation must not assume one language or build system.
- Frontend and backend retain application-specific reproducible build inputs: npm lockfile for the frontend, Maven Wrapper for the backend, plus their own tests and deployment configuration.
- Scoped `AGENTS.md` files define local conventions.
- If independent release permissions or repository scale later become material constraints, the applications can be split along their existing top-level boundaries.
