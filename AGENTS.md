# System Design Copilot Agent Guide

## Mission

System Design Copilot is an active-practice workspace. Help users reason about requirements, architecture, failure modes, and trade-offs. Do not turn the product into a passive course, generic chatbot, diagram generator, or automatic architecture generator.

The canonical domain language is in `CONTEXT.md`. Product requirements are in `docs/product/PRD.md`. System-wide technical decisions are in `docs/adr/`.

## Repository Map

- `frontend/`: Next.js web application. Follow `frontend/AGENTS.md`.
- `backend/`: Spring Boot API and background consumers. Follow `backend/AGENTS.md`.
- `infra/`: local and hosted infrastructure definitions. Follow `infra/AGENTS.md`.
- `docs/`: product, architecture, implementation, and decision records. Follow `docs/AGENTS.md`.

The closest `AGENTS.md` applies. A child file may add stricter rules but must not contradict this file.

## Architecture Boundaries

- Treat the Spring Boot API as the security and business-policy boundary.
- The browser must never call OpenRouter, Stripe secret APIs, Redis, RabbitMQ, or the database directly.
- Keep the backend a package-by-feature modular monolith until an accepted ADR changes that decision.
- Use REST under `/api/v1` and publish an OpenAPI document. Generate frontend API types from that contract.
- Keep PostgreSQL authoritative for durable product, identity, billing, usage, and job state.
- Use Redis only for disposable cache, rate limits, and short-lived coordination.
- Use RabbitMQ for asynchronous work, not as the durable source of job status.
- A Review always evaluates an immutable Architecture Revision.
- AI output is advisory. It may suggest changes but must not silently mutate a user's architecture.

## Engineering Workflow

1. Read the relevant PRD requirement, `CONTEXT.md`, accepted ADRs, and the nearest `AGENTS.md`.
2. Make the smallest end-to-end change that satisfies the behavior.
3. Add or update tests at the boundary where the behavior can regress.
4. Run the scoped checks while working and all affected checks before finishing.
5. Update documentation when behavior, terminology, deployment, or an architectural decision changes.

Do not add compatibility layers for behavior that has not shipped or data that does not exist. Do not introduce a new framework, state store, broker, database, or hosted service without documenting the trade-off.

## Security And Privacy

- Never commit secrets. Document required variables in `.env.example` with inert placeholders.
- Never log passwords, cookies, JWTs, refresh tokens, reset tokens, Stripe payload secrets, or full private architecture documents.
- Enforce ownership and entitlements in the backend even when the UI hides an action.
- Validate all external input, including AI output, imported documents, webhooks, messages, and environment configuration.
- Use Clerk-managed browser sessions and short-lived API JWTs. Spring Boot validates Clerk JWT issuer, audience, authorized party, expiry, signature, and subject; the frontend uses strict Content Security Policy and explicit CORS allowlists.
- Verify Stripe signatures and make webhook processing idempotent.
- Make RabbitMQ consumers idempotent and cap retries before dead-lettering.
- Minimize architecture context sent to AI providers and retain provider metadata needed for audit and cost analysis.

## Definition Of Done

A change is complete when:

- The requested behavior and failure paths are implemented.
- Ownership, authorization, quota, and validation boundaries are covered.
- Tests pass for every affected application.
- Database changes use forward Flyway migrations.
- Public API changes update OpenAPI and generated frontend types.
- New asynchronous behavior is observable, retry-safe, and idempotent.
- Relevant PRD, architecture, glossary, or ADR documentation is current.
- No secrets or generated build artifacts are included.

## Verification

Run commands from the owning directory unless a root script explicitly wraps them.

Frontend:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Backend:

```text
./mvnw verify
```

On Windows PowerShell use `./mvnw.cmd verify`.

Infrastructure:

```text
docker compose config
docker compose up -d
docker compose ps
```

Use the commands that exist for the current implementation phase. When a planned command has not been scaffolded yet, state that explicitly rather than claiming it passed.

## Documentation Rules

- Change `CONTEXT.md` only when canonical domain language changes; keep implementation details out of it.
- Keep requirement identifiers in the PRD stable once implementation references them.
- Create ADRs only for consequential, difficult-to-reverse decisions with real alternatives.
- Do not rewrite an accepted ADR to hide a later change. Supersede it with a new ADR.
- Keep operational instructions in runbooks or infrastructure docs, not in ADRs.

## Agent skills

### Issue tracker

Issues and specs use local Markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage labels are configured locally. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository using root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
