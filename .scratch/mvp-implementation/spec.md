# System Design Copilot MVP

Status: ready-for-agent

## Problem Statement

Learners and engineers need an active-practice workspace for developing system-design judgment. They need to create and evolve an Architecture Document, state Requirements, Assumptions, and Decisions, respond to Scenarios, and receive evidence-grounded AI feedback without surrendering control of the design. The product must preserve private Workspace ownership, enforce Plan and usage policy in the backend, and begin as a low-cost, public Free personal beta before a commercial launch.

## Solution

Deliver the approved System Design Copilot MVP as a Next.js frontend and Spring Boot modular monolith. Clerk provides managed identity while Spring Boot remains the business-policy boundary. Users create fixed-type private Workspaces from curated Challenges, custom designs, validated Import Packages, or Manual Recreation Review Briefs; build and save Architecture Documents; record reasoning; receive advisory Copilot guidance and asynchronous Reviews; and track usage and progress.

The first hosted release is a public Free, best-effort personal beta. Participants use the Free Plan, Stripe remains in test mode, AI requires consent and uses strict privacy routing, and the application enforces a USD 0.10 global daily AI cap. Commercial launch is separately gated on a commercial-eligible frontend host, paid broker, payment enablement, and production recovery controls.

## User Stories

1. As a beta participant, I want to register for the public Free beta, so that I can begin practice without an invitation while the product still enforces abuse and spend controls.
2. As a User, I want to sign in with email/password, Google, or GitHub through Clerk, so that authentication is secure without product-managed credentials.
3. As a User, I want my session restored after refresh and to sign out of one or all sessions, so that I control product access.
4. As a User, I want the product to recognize me through a durable internal User record, so that my Workspaces remain mine across sessions.
5. As a User, I want the API to reject an invalid, expired, wrongly issued, or wrongly authorized Clerk token, so that another party cannot access my data.
6. As a Free User, I want to see my Plan, usage, and renewal rules, so that I understand allowed operations.
7. As a User, I want backend-enforced Workspace and AI limits, so that displayed access rules are trustworthy.
8. As a User, I want to create, rename, archive, restore, and delete a private Workspace, so that I can manage my practice work.
9. As a User, I want to create a custom Workspace without receiving a generated architecture, so that I practice reasoning myself.
10. As a User, I want to browse accessible curated Challenges and start a private Workspace from one, so that I can practice realistic prompts.
11. As a User, I want to import and export the documented portable design format, so that I can move design work without transferring identity, billing, or Review data.
12. As a User, I want to record Requirements, Assumptions, estimates, unresolved questions, and Decisions, so that my design reasoning is explicit.
13. As a User, I want to create and edit Components and directed Connections on an Architecture Document, so that I can model a system.
14. As a User, I want autosave, visible save state, optimistic conflict handling, and keyboard alternatives, so that I do not silently lose or become unable to edit my work.
15. As a User, I want to submit an Architecture Revision for Review while continuing to edit my working document, so that feedback evaluates a stable design snapshot.
16. As a User, I want to give and withdraw AI Processing Consent, so that I control whether bounded private Workspace context is sent to an AI provider.
17. As a User, I want Copilot guidance to ask questions and explain trade-offs rather than silently changing my design, so that I retain authorship and learn judgment.
18. As a User, I want clear AI-unavailable, quota, timeout, refusal, and retry states, so that failed AI work does not consume duplicate allowance or appear successful.
19. As a User, I want Scenarios that change conditions and let me record my response, so that I can practice adaptation and defense.
20. As a User, I want an asynchronous Review status and a completed Review with evidence-linked Findings, scores, uncertainty, and next actions, so that feedback is actionable and credible.
21. As a User, I want a retryable failed Review to use the same Architecture Revision without duplicate monthly usage, so that provider failure does not penalize me.
22. As a User, I want to compare completed Reviews from the same Workspace, so that I can observe changes without false claims of causality.
23. As a User, I want to view recent activity, Review history, and appropriately qualified trends, so that I can resume practice and assess progress.
24. As a User, I want to request account deletion and cancel it during the recovery period, so that I control my private product content.
25. As a beta participant, I want clear disclosure that beta data is best-effort and disposable, so that I do not assume production recovery guarantees.
26. As an operator, I want safe logs, metrics, correlation identifiers, and durable job state, so that failures are diagnosable without exposing private Workspace content.
27. As an operator, I want a global USD 0.10 daily beta AI cap, so that provider spend cannot exceed the personal-beta budget.
28. As an operator, I want production controls to remain explicit commercial-launch gates, so that the beta does not imply paid-service reliability or billing readiness.

## Implementation Decisions

- The backend remains a package-by-feature modular monolith and is the security, ownership, Entitlement, quota, validation, billing, and AI-policy boundary.
- The browser uses Clerk for authentication and sends a short-lived Clerk JWT to the API only when needed. The API validates issuer, audience, authorized party, signature, expiry, and immutable subject. It does not manage passwords, refresh tokens, OAuth credentials, or CSRF cookies.
- Clerk owns public Free-beta registration and identity. The product has no Invitation entity, API, or database table; abuse protection is enforced through Clerk and backend policy boundaries.
- PostgreSQL stores the durable internal User associated with Clerk's immutable user ID and remains authoritative for all durable product state.
- REST is versioned under `/api/v1`, described by OpenAPI, and consumed through generated frontend types. Errors use RFC 9457 Problem Details with stable application error codes.
- The frontend uses the repository-root `DESIGN.md` as its design source, a narrow browser prototype as the approval baseline, and Tailwind CSS plus shadcn/ui as its implementation system. Playwright screenshot coverage is limited to stable public pages and core states.
- The Architecture Document is validated schema-versioned JSONB. Requirements, Assumptions, Decisions, Reviews, Findings, Usage Records, and job state remain relational. Review submission creates an immutable Architecture Revision.
- Access to all User-owned resources is checked by authenticated User and resource relationship, never a client-supplied owner identifier.
- Free and Pro share the same AI model profiles. The Copilot profile uses `deepseek/deepseek-v4-flash-0731`; the Review profile uses `openai/gpt-5.6-luna`. Plans differ only in backend-enforced allowance and operational controls.
- Every AI operation requires current AI Processing Consent. OpenRouter routing uses `data_collection: "deny"` with provider fallback disabled. No eligible provider produces a recoverable unavailable result rather than weaker privacy.
- AI context is bounded, treats Workspace text as untrusted data, excludes secrets and unrelated content, and records safe model, provider, prompt, token, latency, outcome, and cost metadata.
- Reviews are asynchronous. Submission atomically creates the Revision, Review Request, durable job state, and outbox event. RabbitMQ delivery is at least once; consumers are idempotent, lease work, use bounded retries, and dead-letter exhausted work. PostgreSQL is Review status authority.
- Stripe is the commercial payment authority; verified webhook projections drive backend Entitlements. During personal beta, Stripe uses test mode only, and only a synthetic local or staging test account receives test Pro activation.
- The personal beta is Vercel Hobby, public Free-only, best-effort, and does not promise recovery or backup-deletion guarantees. Commercial launch requires a commercial-eligible frontend host, paid broker, independent backups, restore drill, deletion-tombstone workflow, production observability, abuse controls, and real payment enablement.
- The initial product-maintained Curated Challenge library contains URL shortener, news feed, and ticket booking. A Challenge-authoring UI remains out of scope.

## Testing Decisions

- Test externally observable behavior at the highest available boundary; do not test private implementation structure.
- Use Spring MVC integration tests for REST contract validation, Clerk JWT rejection and identity association, ownership denial, Entitlement enforcement, import validation, and Problem Details.
- Use Testcontainers for PostgreSQL, Redis, and RabbitMQ behavior that relies on their real semantics, including migrations, quota races, outbox delivery, retries, leases, and duplicate messages.
- Use fake HTTP services for Clerk key and lifecycle behavior, OpenRouter responses, Stripe webhooks, and notification email behavior.
- Use frontend unit and component tests for forms, save states, consent states, and client error handling. Use Playwright for key browser journeys and focused stable screenshot checks.
- Test privacy routing, AI Processing Consent withdrawal, daily budget exhaustion, malformed structured output, timeout, no eligible provider, and duplicate AI usage semantics.
- The existing backend starter integration test is the only current test prior art. New tests establish the product boundaries listed above.

## Out Of Scope

- Real payment collection and paid Pro access for ordinary Users during the personal beta.
- Team Workspaces, organizations, real-time collaboration, public sharing, community Challenge authoring, native mobile applications, and full event-sourced edit history.
- Automatic architecture generation or direct AI mutation of a Workspace.
- Production RPO/RTO, independent backup recovery, and backup-deletion-tombstone guarantees during the personal beta.
- A custom Invitation domain model or application-managed authentication lifecycle.
- A more expensive Pro-only AI model tier or automatic AI model/provider fallback.

## Further Notes

- `CONTEXT.md` provides canonical terms such as Architecture Document, Architecture Revision, AI Processing Consent, Review Request, and Workspace.
- ADR-0004 is superseded by Clerk decisions in ADR-0009 and ADR-0010. ADR-0011 governs consent and non-retaining AI routing.
- The implementation plan remains the delivery order. Tickets should be sliced vertically, worked by blocking edge, and begin with the walking skeleton before Identity, billing, Workspace, AI, and Review depth.
