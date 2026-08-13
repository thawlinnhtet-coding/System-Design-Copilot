# System Design Copilot Implementation Plan

| Field   | Value         |
| ------- | ------------- |
| Status  | Approved plan |
| Version | 1.1           |
| Date    | 2026-08-04    |

## 1. Goal

Deliver the phased MVP in vertical, deployable increments. Each milestone must leave the repository in a tested state and establish only the infrastructure needed by current behavior.

This plan implements `docs/product/PRD.md` using the architecture in `ARCHITECTURE.md` and the accepted decisions in `docs/adr/`.

## 2. Delivery Principles

- Build one end-to-end path before broadening feature depth.
- Keep the Spring Boot application as one deployable modular monolith.
- Make ownership, authorization, validation, and Entitlement checks part of each slice.
- Add failure-path tests when introducing an external dependency.
- Publish OpenAPI and update generated frontend types in the same change as an API contract change.
- Introduce Flyway migrations only in forward order; never edit a released migration.
- Complete each slice locally with relevant unit, integration, browser, lint, type, build, migration, and OpenAPI checks before starting the next slice.
- Keep hosted deployment configuration ready during development, then deploy the fully integrated MVP during launch hardening.
- Do not defer observability, idempotency, or cost controls until after AI launch.

## 3. Milestone 0: Product And Engineering Foundation

### Scope

- Create root and scoped `AGENTS.md` guidance.
- Define canonical terms in `CONTEXT.md`.
- Approve the PRD, target architecture, implementation plan, and initial ADRs.
- Establish requirement identifiers and MVP boundaries.

### Exit Criteria

- Product terminology is internally consistent.
- Every consequential initial architecture choice has a recorded decision.
- MVP, later, and out-of-scope capabilities are distinguishable.
- The next milestone can scaffold without unresolved repository or topology decisions.

## 4. Milestone 1: Deployable Walking Skeleton

### Backend

- Scaffold Java 25 Spring Boot with Maven Wrapper.
- Select and pin a stable Spring Boot version.
- Add Spring Web, Validation, Security, Actuator, and Springdoc. Add Spring AI, persistence, messaging, and mapping libraries only with the slices that use them.
- Establish the `system` and `common` packages and an architecture-test foundation. Add feature boundaries only with the feature they contain.
- Add a versioned health/info endpoint and RFC 9457 error baseline.
- Add a first application integration test without runtime service dependencies.

### Frontend

- Scaffold Next.js App Router with strict TypeScript and npm.
- Use the repository-root `DESIGN.md` as the UI design source, validate a narrow browser prototype, and implement with Tailwind CSS and shadcn/ui. Add TanStack Query, Vitest, Testing Library, and Playwright. Add Zustand, React Hook Form, Zod, and React Flow with the editor and form features that use them.
- Establish the public route layout. Add authenticated routes with the identity feature.
- Create the typed API client and an OpenAPI type-generation command.
- Add a health-status page that calls the backend.

### Infrastructure

- Do not require local runtime services for the health-only path. Add to `compose.yaml` only the services needed by the current milestone.
- Pin every added image and give each local service health checks, named volumes, and development-only credentials.
- Add application `.env.example` files with inert placeholders.
- Add backend container build and deployment configuration.
- Add Vercel and Northflank configuration documentation and local deployment verification instructions. Defer hosted provisioning and verification until Milestone 8 after all MVP local checks pass.

### Automation

- GitHub Actions frontend CI: `npm ci`, lint, type-check, unit tests, build.
- GitHub Actions backend CI: Maven `verify`.
- Add an OpenAPI generation or drift check that prevents stale generated frontend types.
- Add GitHub dependency update and secret-scanning configuration available to the repository.
- Add focused Playwright screenshot checks for Markdown-and-browser-approved public pages and stable core states; exclude the dynamic architecture canvas from visual regression.

### Exit Criteria

- Frontend and backend run on the host and the frontend reaches the backend.
- All local quality gates pass before launch deployment begins.
- OpenAPI generation and all initial quality gates pass from a clean checkout.

## 5. Milestone 2: Identity Tracer Bullet

### Slice 2.1: Registration And Verification

- Add the identity feature boundary, PostgreSQL, and Flyway, with Testcontainers coverage for persistence behavior. Add Mailpit only when product notification email is introduced.
- Add infrastructure CI validation and service-health smoke checks when `compose.yaml` first gains services.
- Add a User migration containing an immutable, unique Clerk user ID; do not create product credential or authentication-token tables.
- Configure Clerk email/password registration, verified email, and account recovery in a development instance.
- Build Clerk-backed registration and verification-pending pages.
- Associate a validated Clerk identity with a product User without using a client-supplied email as an identity key.

### Slice 2.2: Clerk Session And API Authorization

- Add Redis and its local Compose service for backend rate limits and other disposable coordination.
- Implement Clerk session bootstrap, current-session and all-session sign-out controls, short-lived API-token acquisition, and Spring Security JWT validation.
- Configure an API-token lifetime of at most 10 minutes and validate token issuer, audience, authorized party, expiry, signature, and immutable subject.
- Configure an explicit CORS allowlist for the `Authorization` header and a strict frontend Content Security Policy.
- Add authenticated `/me` contract and frontend session bootstrap.
- Test token expiry, revocation bounds, rejected issuer/audience/authorized-party/signature, CORS, CSP, and cross-User access.

### Slice 2.3: Managed Recovery And Social Login

- Configure Clerk Google and GitHub social connections, account linking, and password reset.
- Verify managed-provider failure, cancellation, existing-account, account-linking, and product identity-association behavior.

### Exit Criteria

- A User can register, verify, log in, restore a managed session, log out, reset a password, and log in with Google or GitHub through Clerk.
- The frontend does not persist API tokens and only obtains short-lived Clerk API JWTs when calling the backend.
- Authentication-provider, JWT-validation, backend-rate-limit, and token-transport failure paths are integration-tested.
- The authentication browser flow is covered by automated browser tests using deployment-equivalent CORS and Content Security Policy configuration.

## 6. Milestone 3: Plans, Usage, And Stripe

### Slice 3.1: Entitlement Policy

- Implement Free and Pro Plan configuration.
- Implement active Workspace, Copilot Turn, Review, concurrency, and spend policies.
- Add durable Usage Records with transactional quota checks.
- Expose current Plan, usage, and renewal window through `/me`.

### Slice 3.2: Stripe Billing

- Add Stripe customer and subscription projection migrations.
- Use Stripe test-mode credentials and the documented temporary HTTPS tunnel for locally hosted webhook verification; do not deploy the application.
- Create Checkout and Customer Portal sessions through backend-only Stripe calls.
- Implement raw-body signature verification and idempotent webhook receipts.
- Handle subscription created, updated, canceled, payment failure, and reconciliation cases.
- Implement and test the documented Stripe-state and 7-day `past_due` grace mapping.
- Add pricing, checkout return, billing settings, and Plan-boundary UI.

### Exit Criteria

- Free policy is enforced in application services, not only the UI.
 - Stripe test-mode activation grants Pro after a verified webhook for authenticated test users when enabled; `STRIPE_SYNTHETIC_CLERK_SUBJECT` remains an optional local/staging allowlist, and blank allows any authenticated test user without real charges.
- Duplicate and out-of-order webhook tests pass.
- Downgrade behavior preserves content and follows `BILL-007`.

## 7. Milestone 4: Workspace And Architecture Editor

### Slice 4.1: Workspace Lifecycle

- Add Workspace, Requirement, Assumption, Decision, Workspace Scenario, and Scenario Response migrations.
- Implement create, list, retrieve, rename, archive, restore, and delete.
- Start with Custom Design Workspaces to establish the smallest vertical path, while persisting fixed Workspace Type and Workspace Source values.
- Build the Custom Design Workspace create flow from Workspace name and System Idea, the Clarify focus, flexible Clarify/Design/Stress-test/Feedback stage rail, and Workspace shell.
- Keep the initial Architecture Document blank and make the first Requirement, Canvas, and Copilot entry points progressive rather than blocking.
- Enforce ownership and active-Workspace Entitlements.

### Slice 4.2: Document Contract

- Define architecture schema version 1 and the portable Import Package JSON schema containing supported Requirements, Assumptions, Decisions, and Architecture Document content.
- Add Architecture Document and Architecture Revision migrations.
- Implement server validation, document limits, optimistic version saves, and conflict errors.
- Implement import/export sanitization and document schema tests.

### Slice 4.3: Canvas

- Define the complete vendor-neutral Component Type taxonomy across clients, edge, networking, security, compute, data, messaging, coordination, identity, operations, external systems, and Boundaries.
- Ship Phase 1 palette coverage for Browser Client, Mobile/API Client, DNS, CDN, WAF, Load Balancer, API Gateway, Service, Worker, Function, Relational Database, NoSQL Database, Cache, Object Storage, Queue, Event Bus, Identity Provider, External API, Region, Network, Cluster, and Trust Boundary.
- Add Custom Component fallback with semantic icon selection, labels, category, provider metadata, and extensible metadata.
- Add a minimal common Component property core with stable Component Type and label plus optional description, provider metadata, and extensible metadata. Keep placement, size, and visual state outside Component properties.
- Add typed category properties for responsibility/runtime/state/scaling on Compute, model/access/partitioning/consistency/replication/retention/recovery on Data Stores, delivery/ordering/retry/retention/replay on Messaging, traffic/trust/authentication on Edge and Security, and trust/lifecycle/signals on Identity, Secrets, and Observability.
- Use bounded text and typed enums for v1 Component properties, reject unknown typed fields, and bound extensible metadata; do not model credentials, provider runtime configuration, or runtime simulation.
- Add typed Connection Intents for request/response, DNS resolution, data read/write, event publish/consume, queue delivery, stream, replication, authentication, and file/object transfer.
- Model Regions, networks, subnets, clusters, zones, and trust scopes as nested labeled Boundaries with one visual parent per document layer.
- Add categorized palette, click-to-place, optional drag-and-drop, and searchable keyboard insertion.
- Implement controlled React Flow nodes, Connections, selection, property panels, grouping, undo/redo, and viewport persistence.
- Implement a Workspace-keyed Zustand editor store.
- Add debounced autosave and explicit save/conflict/offline status.
- Add keyboard alternatives for essential actions.

### Slice 4.4: Reasoning Panels

- Build Requirement, Assumption, estimate, unresolved-question, and Decision workflows.
- Link Decisions to evidence identifiers.
- Preserve current edit state while navigating between canvas and reasoning panels.

### Exit Criteria

- A Free User can create, edit, close, and resume a custom Workspace.
- Stale-tab conflicts cannot silently lose data.
- Ownership tests cover every Workspace child resource.
- Representative maximum-size documents remain acceptably interactive.

## 8. Milestone 5: Curated And Imported Entry Paths

### Slice 5.1: Challenge Catalog

- Define version-controlled starter Challenge content and seed strategy for URL shortener, news feed, and ticket booking.
- Publish immutable Challenge Versions with problem, constraints, tags, difficulty, estimated practice time, and optional Scenarios.
- Implement public-safe catalog metadata, filters, Plan visibility, locked premium previews, and Challenge detail.
- Create a Challenge Workspace by snapshotting the selected Challenge Version and offer continue-or-new behavior for existing attempts.
- Keep reference architectures hidden from the Challenge catalog and Workspace start flow.
- Add premium access tests even if the first seed set is mostly Free.

### Slice 5.2: Import And Export

- Add browser pre-validation for user feedback.
- Send files to the backend for authoritative validation and sanitization.
- Reject unsupported schema versions and all server-owned fields.
- Return validated portable starting content to the owning Workspace creation flow without deciding Workspace Type or Review behavior.
- Export portable design data only.

### Slice 5.3: Manual Architecture Review Entry

- Add Review Brief capture with required System Description and Review Goal plus optional Known Requirements and Assumptions.
- Require a Review Goal and create an Import Package-sourced Architecture Review Workspace for validated imported content.
- Create a Manual Recreation-sourced Architecture Review Workspace with a blank Architecture Canvas.
- Preserve the Review Brief as Workspace context and allow repeated editable Revisions and Reviews.

### Exit Criteria

- Challenge, Custom Design, Import Package, and Manual Recreation Workspace entry paths complete end to end with fixed Workspace Types and visible Sources.
- Invalid import errors identify location and correction where safe.
- Imported ownership, identity, billing, Review, and provider fields cannot affect server records.

## 9. Milestone 6: Contextual Copilot And Scenarios

### Slice 6.1: AI Provider Foundation

- Add Spring AI and the copilot feature boundary when this slice begins.
- Implement application-owned AI ports and the Spring AI OpenRouter adapter.
- Validate model profile, base URL, timeouts, token limits, and budget configuration at startup. Start with `deepseek/deepseek-v4-flash-0731` for Copilot Turns and `openai/gpt-5.6-luna` for full Reviews; do not configure an automatic fallback model.
- Persist versioned AI Processing Consent. Require it before context assembly, send OpenRouter requests with `data_collection: "deny"` and provider fallback disabled, and report no-eligible-provider outcomes without weakening the policy.
- Build a fake OpenAI-compatible provider for integration tests.
- Persist prompt template version and provider metadata.

### Slice 6.2: Copilot Turns

- Add thread and message migrations.
- Implement bounded Workspace context assembly and prompt-injection-resistant content framing.
- Implement short response streaming through the Spring backend.
- Persist only accepted responses and apply Usage Record semantics.
- Build Copilot panel, retry, refusal, timeout, quota, and disconnected-stream states.

### Slice 6.3: Scenarios

- Implement curated Scenario presentation and response capture first.
- Introduce curated Challenge Scenarios as progressive, inspectable, non-blocking pressure tests.
- Add constrained AI-assisted Scenario generation after the curated path is stable.
- Validate generated Scenario schema and relevance.
- Link completed Scenarios into later Review context.

### Exit Criteria

- Copilot responses refer to the current Workspace and default to guidance rather than complete solutions.
- No browser code contains an OpenRouter key or direct provider call.
- Cost, quota, timeout, malformed response, and retry paths are tested.
- AI cannot mutate the Architecture Document.

## 10. Milestone 7: Reliable Evidence-Based Reviews

### Slice 7.1: Durable Job Submission

- Add Spring AMQP, RabbitMQ, and its local Compose service when asynchronous Review work is introduced.
- Add Review job, Review, score, Finding, outbox, and processed-message migrations.
- Implement idempotent Review submission.
- Atomically create Architecture Revision, pending job, and outbox event.
- Implement reclaimable outbox leases, RabbitMQ publication, publish confirmation, and retry.
- Declare durable Review exchange, queue, retry routing, and dead-letter queue.

### Slice 7.2: Review Consumer

- Claim jobs idempotently and reject unauthorized or obsolete state transitions.
- Build bounded immutable Revision context.
- Request structured Review output.
- Validate rubric, evidence IDs, severity, score ranges, content limits, and uncertainty.
- Persist completed Review and Usage Record before acknowledging.
- Implement retry classification and final failure state.
- Use renewable database job leases so a crash after claim cannot strand a Review Request.
- Record safe metadata for every provider attempt without retaining raw provider payloads by default.

### Slice 7.3: Review Experience

- Submit Reviews and poll status through TanStack Query.
- Display dimension evidence, Findings, strengths, uncertainty, and prioritized next actions.
- Link evidence back to Components, Connections, Requirements, Decisions, and Scenarios.
- Compare two Reviews from the same Workspace without implying invalid causal certainty.
- Let the User retry a failed-retryable Review Request against the same Revision; create a new internal attempt and consume monthly usage only on completion.

### Exit Criteria

- Review submission survives application and RabbitMQ interruption after durable acceptance.
- Duplicate messages cannot duplicate Reviews or Usage Records.
- Exhausted jobs are visible in the dead-letter queue and in durable final state.
- A completed Review satisfies the PRD output contract.

## 11. Milestone 8: Progress, Privacy, And Launch Hardening

### Product

- Add recent activity, Review history, basic dimension trends, and usage visibility.
- Implement recent Clerk-authenticated Account Deletion Requests, immediate Clerk-session revocation and product-access suspension, bounded 10-minute API JWT expiry, renewal cancellation, 7-day recovery, a Clerk-authenticated cancellation link, an external create-only deletion tombstone, irreversible Clerk and product-content deletion, restricted legal-record retention, and backup-expiry handling.
- Complete responsive behavior and accessibility remediation.
- Add actionable empty, degraded, quota, and provider-outage states.

### Operations

- For commercial launch, build and locally test the backup image, restore tooling, create-only Cloudflare Worker routes, manifest validation, retention configuration, and Northflank scheduled-job definition.
- For commercial launch, provision production-like Neon PostgreSQL, Upstash Redis, CloudAMQP RabbitMQ, Vercel, Northflank, Cloudflare R2, and Worker resources with managed secrets and deployment configuration.
- Use CloudAMQP's free development tier only for local development and private personal-beta validation; provision a paid broker before commercial release.
- For commercial launch, create a versioned `age` backup keypair, expose only the public key to the job, and escrow private keys in an operator password manager plus an encrypted offline recovery copy.
- For commercial launch, deploy the integrated frontend and backend to staging, configure sibling `app.<staging-domain>` and `api.<staging-domain>` custom domains, and verify TLS, CORS, Clerk sessions and social-login callbacks, email links, Stripe redirects, liveness, readiness, and recovery behavior in current browsers.
- For commercial launch, promote the verified staging release to production, configure sibling production custom domains, and repeat deployed smoke tests. Record public service URLs and verification dates without recording provider credentials or private dashboard URLs.
- For the initial personal beta, deploy the frontend only under Vercel Hobby terms; keep every participant on the Free Plan; keep Stripe in test mode; and disable real Checkout and paid Pro access. Perform the staging and commercial-production steps only after moving the frontend to a commercial-eligible host or plan.
- Allow public Free registration through Clerk without creating a product Invitation record or API. Require progressive abuse controls, verified email before AI/billing, and Free-only Stripe test-mode guardrails during the personal beta.
- Treat personal-beta data as best-effort and disposable, disclose that no recovery or backup-deletion guarantee exists, and defer the independent backup, restore, RPO/RTO, and deletion-tombstone release gates to commercial launch.
- For commercial launch, add structured production logs, correlation IDs, safe metrics, and alerts.
- For commercial launch, add dashboards or provider-native views for queue depth, dead letters, AI failures and cost, database saturation, webhook lag, backup failures, and verified-backup age over 18 hours.
- For commercial launch, add runbooks for migration failure, rollback, RabbitMQ outage, dead-letter replay, OpenRouter outage, Stripe reconciliation, and credential rotation.
- For commercial launch, configure the 12-hour Northflank backup job with three bounded retries and 35-day retention for the private Cloudflare R2 backup target and create-only upload and deletion-tombstone routes.
- For commercial launch, run and record a production-like encrypted backup restore, independent private-key recovery, and deletion-tombstone replay against the 24-hour RPO and 8-hour RTO targets.
- Before commercial launch, validate Neon, Upstash, CloudAMQP, Northflank, Vercel, Cloudflare R2 and Workers, Resend, Stripe, Google, and OpenRouter current quotas and terms.
- Set the personal-beta global AI daily budget to USD 0.10 and configure emergency-disable controls.

### Quality

- Run the complete frontend, backend, infrastructure, and Playwright suites from clean environments.
- Run representative document-size and Review concurrency tests.
- Perform dependency, secret, authorization, webhook, import, Content Security Policy, and prompt-injection reviews.
- Run deployed smoke tests against production-like custom domains.

### Exit Criteria

- Every MVP requirement is implemented, tested, deferred explicitly, or removed through an approved PRD change.
- Core workflows meet accessibility and browser support requirements.
- Operators can detect and recover from documented failure modes.
- No known critical security, data-loss, billing, or uncontrolled-cost defect remains.

## 12. Post-MVP Milestone: Interview Experience

After MVP evidence supports continued investment:

- Add timed mock-interview sessions.
- Add an interviewer mode with staged clarification and follow-up questions.
- Evaluate communication and trade-off articulation separately from architecture fitness.
- Add premium interview Challenge packs.
- Add personalized practice recommendations based on sufficient Review history.

Voice, recording, and organization features require separate privacy and architecture decisions before implementation.

## 13. Cross-Cutting Test Matrix

| Boundary       | Required coverage                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Ownership      | User A cannot read or mutate User B resources                                                       |
| Entitlements   | Free limit, Pro grant, downgrade, override, concurrent quota attempt                                |
| Authentication | API-token expiry and validation, managed-session revocation, logout, social-login failure, identity association |
| Architecture   | Schema limits, unsupported version, stale save, import sanitization, revision immutability          |
| RabbitMQ       | Duplicate, retryable failure, final failure, dead letter, restart, delayed broker                   |
| AI             | Timeout, refusal, malformed JSON, invalid evidence, oversized output, budget disabled               |
| Stripe         | Invalid signature, duplicate, out-of-order event, cancellation, delayed webhook                     |
| Email          | Provider timeout, expired token, reused token, safe resend behavior                                 |
| Deletion       | Reauthentication, recovery, idempotent purge, billing-record restriction, restored-backup tombstone |
| Backup         | Encryption, checksum failure, retention, clean restore, measured RPO/RTO                            |
| Frontend       | Loading, empty, error, forbidden, quota, conflict, offline, responsive, keyboard                    |

## 14. Required Environment Configuration

Names may be refined during scaffolding, but configuration must cover:

```text
APP_BASE_URL
API_BASE_URL
DATABASE_URL
REDIS_URL
RABBITMQ_URL
CLERK_SECRET_KEY
CLERK_JWT_ISSUER
CLERK_JWT_AUDIENCE
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
OPENROUTER_API_KEY
OPENROUTER_BASE_URL
OPENROUTER_COPILOT_MODEL
OPENROUTER_REVIEW_MODEL
AI_DAILY_BUDGET_USD
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_PRICE_ID
RESEND_API_KEY
MAIL_FROM_ADDRESS
R2_ENDPOINT
R2_BUCKET
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
BACKUP_UPLOAD_GATEWAY_URL
BACKUP_UPLOAD_GATEWAY_TOKEN
BACKUP_AGE_PUBLIC_KEY
```

`.env.example` contains inert placeholders only. Production values live in Vercel, Northflank, Cloudflare, and provider secret stores. R2 access credentials belong only to the Cloudflare upload Worker; Northflank receives the gateway URL/token and the public encryption key. Private decryption keys never appear in runtime environment configuration.

## 15. Definition Of Done Per Slice

A slice is done only when:

- Product behavior and failure behavior satisfy referenced PRD requirements.
- Authorization, ownership, validation, quota, and idempotency are addressed where applicable.
- Database changes use a new Flyway migration.
- API changes update OpenAPI and generated frontend types.
- Unit, integration, and browser tests pass at affected boundaries.
- Logs and metrics make failures diagnosable without leaking private content.
- Documentation and accepted decisions remain accurate.
- Deployed-service configuration is documented when the slice adds a dependency.

## 16. Verification Commands

Frontend, from `frontend/web/`:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Backend, from `backend/api/`:

```text
./mvnw verify
```

On Windows PowerShell:

```text
./mvnw.cmd verify
```

Infrastructure, from the repository root:

```text
docker compose config
docker compose up -d
docker compose ps
```

These commands become enforceable as the corresponding milestone scaffolds them.
