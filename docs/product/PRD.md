# System Design Copilot Product Requirements Document

| Field   | Value                              |
| ------- | ---------------------------------- |
| Status  | Approved for phased implementation |
| Version | 1.0                                |
| Date    | 2026-08-02                         |
| Product | System Design Copilot              |

## 1. Summary

System Design Copilot is an interactive engineering workspace where learners improve system design judgment by building architectures, explaining decisions, responding to changing conditions, and receiving evidence-based AI feedback.

The product teaches through active practice. It is not primarily a course, a generic chatbot, a diagramming tool, or an architecture generator. The core learning loop is:

1. Understand and clarify a problem.
2. State requirements, assumptions, and estimates.
3. Build an Architecture Document.
4. Record Decisions and trade-offs.
5. Respond to Scenarios and defend the design.
6. Request a Review of an immutable Architecture Revision.
7. Apply selected feedback and compare later Reviews.

Product message: **Think Like a Software Architect.**

## 2. Vision

Help anyone become a more confident system designer through realistic practice, intelligent feedback, and continuous improvement.

## 3. Mission

Deliver an interactive workspace where users design distributed systems, defend architectural decisions, explore trade-offs, respond to real-world scenarios, and receive actionable engineering feedback grounded in their own work.

## 4. Product Principles

### 4.1 Practice Before Answers

The product asks questions and exposes trade-offs before offering recommendations. It does not generate a complete architecture as the default experience.

### 4.2 Evidence Before Scores

Feedback and scores cite Requirements, Assumptions, Components, Connections, Decisions, or Scenario responses. A number without evidence is not a useful Review.

### 4.3 Multiple Valid Designs

The product evaluates fitness for stated needs and reasoning quality rather than comparing every design to one hidden reference architecture.

### 4.4 User Control

AI advice is advisory. The user decides whether and how to change the Architecture Document.

### 4.5 Progressive Difficulty

Beginners receive scaffolding while experienced learners can choose less guidance and more demanding Scenarios.

### 4.6 Cost-Aware Quality

AI context, models, and retries are controlled to deliver useful feedback within sustainable SaaS economics.

## 5. Problem Statement

System design learning is often passive. Learners read books, watch videos, memorize reference architectures, or ask a general-purpose assistant to produce a complete solution. These approaches can explain concepts without exercising the decisions engineers must make.

Learners struggle to:

- Translate ambiguous product needs into Requirements.
- Ask useful clarifying questions.
- Estimate traffic, throughput, storage, and latency.
- Choose data, caching, communication, and scaling patterns.
- Identify bottlenecks and single points of failure.
- Compare alternatives and communicate trade-offs.
- Adapt a design when requirements or failure conditions change.
- Receive feedback grounded in their actual design.
- Track whether repeated practice improves their judgment.

System Design Copilot addresses these gaps by making discussion, design, defense, revision, and evidence-based Review the primary experience.

## 6. Positioning

System Design Copilot is not primarily:

- A video course platform.
- A static tutorial or reference guide.
- A generic chatbot.
- A general-purpose diagramming tool.
- An automatic architecture generator.
- A replacement for experienced human architects.

It is an interactive engineering workspace where users build, explain, challenge, review, and improve system architectures with an AI engineering copilot.

## 7. Target Users

### 7.1 Students

Students need a structured starting point, practical experience, contextual explanations, and guidance that does not remove the need to think.

### 7.2 Junior Software Engineers

Junior engineers need to move beyond CRUD applications, reason about distributed systems, identify failure modes, and justify technology choices.

### 7.3 Interview Candidates

Candidates need realistic prompts, clarification practice, follow-up Scenarios, communication feedback, and structured evaluations.

### 7.4 Self-Learners

Self-learners need flexible practice, feedback without a mentor, and a way to review portfolio or personal-project architectures.

### 7.5 Future Users

Experienced engineers, technical leaders, educators, coaches, teams, and organizations are future audiences. Their collaboration and administration needs are outside the initial release.

## 8. Personas

### 8.1 Emma, University Student

Emma wants to learn system design before internships. She does not know where to start and needs progressive prompts and practical feedback.

### 8.2 Alex, Backend Engineer

Alex is preparing for senior engineering interviews. He needs realistic ambiguity, follow-up questions, failure Scenarios, and detailed Review evidence.

### 8.3 Sarah, Self-Learner

Sarah is designing portfolio projects without a mentor. She needs feedback that explains risks without replacing her design.

## 9. Jobs To Be Done

- When I am learning system design, help me practice one decision at a time so I build judgment instead of memorizing solutions.
- When I have an interview coming up, challenge my assumptions and communication so I can defend a design under changing requirements.
- When I am planning a personal system, help me expose risks and alternatives while preserving ownership of the design.
- When I return to practice, show my unfinished work and progress so I can continue without reconstructing context.
- When I receive feedback, show the evidence behind it so I can decide what to change.

## 10. Commercial Model

### 10.1 Free Plan

The Free Plan supports meaningful practice with bounded AI usage:

- Up to 10 active Workspaces.
- Up to 50 accepted Copilot Turns per UTC calendar month.
- Up to 5 completed full Reviews per UTC calendar month.
- Starter Challenge library.
- Core canvas, Requirements, Assumptions, Decisions, Scenarios, JSON import, and JSON export.
- Basic Review history and progress.

### 10.2 Pro Plan

The Pro Plan launches at USD 20 per month:

- Unlimited Workspaces at the product level.
- Unlimited Copilot Turns and Reviews at the product level, subject to fair-use rate, concurrency, and spend protection.
- Full Challenge library.
- Full Review detail and comparison.
- Advanced progress analytics as introduced.
- Professional interview preparation features as introduced.

Pricing and quota values are server-configurable. Marketing may describe Pro as unlimited, but operational controls must prevent abuse, automated extraction, account sharing, and uncontrolled provider spend.

Free and Pro use the same configured model for each AI operation: the Copilot profile uses `deepseek/deepseek-v4-flash-0731` and the Review profile uses `openai/gpt-5.6-luna`. Plan differentiation is limited to backend-enforced usage allowance, rate, concurrency, and fair-use policy; it does not select a more expensive model or weaken AI Processing Consent and privacy routing.

The first hosted release is an invite-only personal beta on Vercel Hobby. Every participant uses the Free Plan. Stripe remains in test mode for that release: it does not collect real payments or grant paid Pro access. The beta is best-effort and disposable: it makes no data-recovery or backup-deletion guarantee and communicates that limitation to participants. Clerk restricts registration to invited participants; the product adds no Invitation record or invitation API. Public registration is enabled only for commercial launch. A commercial launch requires migration to a commercial-eligible frontend hosting plan or provider before real Stripe Checkout is enabled.

## 11. Release Strategy

### 11.1 MVP

The phased MVP includes:

- Email/password, Google, and GitHub authentication.
- Free and Pro Plans with Stripe billing.
- Curated Challenge practice.
- Custom system design.
- Import and export using the versioned System Design Copilot JSON format.
- Structured architecture canvas.
- Requirements, Assumptions, estimates, and Decisions.
- Context-aware Copilot Turns.
- Scenarios and written responses.
- Asynchronous evidence-based Reviews.
- Resume, Review history, and basic progress.

### 11.2 Later

- Dedicated timed mock-interview sessions.
- Voice or recording features.
- Communication-specific interview scoring.
- Advanced personalized learning paths.
- Instructor, team, and organization capabilities.
- Additional external diagram import formats.
- Community Challenge authoring.

## 12. User Journeys

### 12.1 Curated Challenge

1. The User browses accessible Challenges.
2. The User reads the initial problem without seeing a complete solution.
3. The User creates a Workspace from the Challenge.
4. The User clarifies and records Requirements and Assumptions.
5. The User builds the Architecture Document and records Decisions.
6. The Copilot asks contextual questions and explains concepts when requested.
7. The User responds to one or more Scenarios.
8. The User requests a Review.
9. The User inspects evidence-linked Findings and chooses what to improve.

### 12.2 Custom System

1. The User names and describes a system or project.
2. The User defines goals, constraints, expected scale, and quality needs.
3. The product creates a blank or minimal Workspace, not a generated solution.
4. The User designs, discusses, and requests a Review using the same core loop.

### 12.3 Imported Architecture

1. The User chooses a System Design Copilot Import Package.
2. The browser performs preliminary validation and sends the file to the backend.
3. The backend validates ownership-independent content, schema version, size, and limits.
4. The User receives actionable validation errors or a new imported Workspace containing the supported portable Requirements, Assumptions, Decisions, and Architecture Document.
5. The User reviews imported Requirements, Decisions, Components, and Connections before submitting a Review.

### 12.4 Upgrade

1. A Free User reaches a Plan boundary.
2. The UI explains the capability and current usage without hiding existing work.
3. The User opens Stripe Checkout.
4. A verified Stripe webhook updates the subscription projection.
5. The backend grants Pro Entitlements.

### 12.5 Resume

1. The User returns to the dashboard.
2. The dashboard lists recent Workspaces with source, progress, save state, and latest Review state.
3. The User resumes the current Architecture Document and related context.

## 13. Functional Requirements

### 13.1 Identity And Access

- `AUTH-001`: A visitor can register with an email address and password through the managed identity provider.
- `AUTH-002`: The managed identity provider verifies email ownership before the backend enables AI operations or billing changes.
- `AUTH-003`: A visitor can authenticate with Google or GitHub through the managed identity provider.
- `AUTH-004`: A User can request and complete a time-limited password reset through the managed identity provider without the product revealing whether an email is registered.
- `AUTH-005`: A User can sign out of the current session or all managed sessions. Revocation prevents new API tokens, and already issued API JWTs expire within at most 10 minutes.
- `AUTH-006`: Sessions survive a browser refresh through the managed identity provider. The frontend obtains a short-lived API JWT only when making a request and does not persist it in browser storage.
- `AUTH-007`: The managed identity provider protects authentication attempts and token issuance from abuse; the backend rate-limits its own abuse-sensitive operations.
- `AUTH-008`: Account linking is performed only by the managed identity provider with verified ownership and must not silently merge product Users based only on an untrusted email claim.
- `AUTH-009`: A User can request account deletion and see its consequences before confirming.

### 13.2 Challenge Catalog

- `CHAL-001`: A User can browse Challenges available to the User's Plan.
- `CHAL-002`: The catalog can filter by difficulty, topic, and estimated practice time.
- `CHAL-003`: A Challenge includes a problem statement, initial constraints, skill tags, and optional Scenarios.
- `CHAL-004`: Premium Challenge content remains protected by backend Entitlements.
- `CHAL-005`: Starting a Challenge creates a private Workspace while leaving the Challenge unchanged.
- `CHAL-006`: Initial Challenges are maintained by the product and seeded through version-controlled content or administrative migrations; a Challenge-authoring UI is not required for MVP. The starter library contains URL shortener, news feed, and ticket-booking Challenges.

### 13.3 Workspaces

- `WORK-001`: A User can create a Workspace from a Challenge, as a custom system, or from a supported import.
- `WORK-002`: A User can list and resume owned Workspaces.
- `WORK-003`: A User can rename, archive, restore, and permanently delete an owned Workspace.
- `WORK-004`: The backend rejects access to a Workspace not owned by the authenticated User.
- `WORK-005`: Free active-Workspace limits are enforced when creating or restoring a Workspace.
- `WORK-006`: A Workspace displays its source, progress, last saved time, and latest Review state.
- `WORK-007`: Archiving a Workspace preserves its Reviews and does not consume an active-Workspace allowance.

### 13.4 Requirements And Reasoning

- `REQ-001`: A User can create, edit, order, and remove functional and non-functional Requirements.
- `REQ-002`: A User can record Assumptions and capacity estimates with units and explanatory notes.
- `REQ-003`: A User can mark unresolved questions and later resolve them.
- `REQ-004`: A User can record a Decision with rationale, alternatives, positive consequences, risks, and related evidence.
- `REQ-005`: Requirements and Decisions included in an existing Architecture Revision remain historically interpretable after later edits.

### 13.5 Architecture Canvas

- `ARCH-001`: A User can add supported Component types to an Architecture Document.
- `ARCH-002`: A User can connect Components with directed Connections and describe protocol, communication style, and relevant guarantees.
- `ARCH-003`: A User can move, resize, group, configure, duplicate, and delete supported Components.
- `ARCH-004`: The editor supports pan, zoom, selection, undo, redo, and keyboard-accessible essential actions.
- `ARCH-005`: The working Architecture Document autosaves after a short idle period.
- `ARCH-006`: Every save includes an expected version so a stale tab cannot silently overwrite newer work.
- `ARCH-007`: The UI clearly communicates unsaved, saving, saved, conflict, validation, and offline states.
- `ARCH-008`: The backend validates document schema version, identifiers, supported types, ownership, size, and structural limits.
- `ARCH-009`: The canvas remains usable on desktop and tablet; mobile users can inspect and perform essential edits without requiring drag-only interaction.
- `ARCH-010`: A Review submission causes the backend to create an immutable Architecture Revision.

### 13.6 Import And Export

- `IMPT-001`: MVP import accepts only the documented System Design Copilot Import Package JSON format.
- `IMPT-002`: Import rejects unsupported schema versions, invalid identifiers, excessive size, unsupported types, and unsafe text content with actionable errors.
- `IMPT-003`: Import never trusts embedded ownership, Plan, Review, billing, or identity data.
- `IMPT-004`: Successful import creates a new private Workspace and does not overwrite an existing Workspace.
- `IMPT-005`: A User can export an owned Workspace's portable Requirements, Assumptions, Decisions, and Architecture Document without credentials, Usage Records, provider metadata, Reviews, or private account data.

### 13.7 Copilot

- `COP-001`: A User can start or continue a contextual Copilot conversation in an owned Workspace.
- `COP-002`: The Copilot receives only bounded context relevant to the current request.
- `COP-003`: Guidance defaults to questions, trade-offs, and explanations rather than a complete architecture.
- `COP-004`: The Copilot identifies when it lacks sufficient context rather than presenting unsupported certainty.
- `COP-005`: A Copilot response cannot directly mutate Requirements, Decisions, or the Architecture Document.
- `COP-006`: The User can retry a failed turn without consuming duplicate quota for a request that did not produce an accepted response.
- `COP-007`: The system records model, provider request ID, prompt version, token usage, cost when available, and outcome metadata without exposing secrets.
- `COP-008`: The backend enforces Plan quota, rate, concurrency, and system budget policies.
- `COP-009`: Before the first AI operation, a User gives AI Processing Consent after seeing the provider-routing policy. A User can withdraw consent, which blocks future AI operations without retracting context already sent to a provider.

### 13.8 Scenarios

- `SCEN-001`: A Workspace can present a curated or AI-assisted changed condition relevant to the design.
- `SCEN-002`: A Scenario can represent growth, failure, data consistency, security, operations, or changing product needs.
- `SCEN-003`: The User can record a response and related architecture or Decision changes.
- `SCEN-004`: AI-generated Scenarios are validated and remain advisory.
- `SCEN-005`: Reviews may evaluate whether the design and reasoning address completed Scenarios.

### 13.9 Reviews

- `REV-001`: A User can request a full Review only for an owned Workspace and within current Entitlements.
- `REV-002`: Review submission creates an immutable Architecture Revision before asynchronous processing begins.
- `REV-003`: A Review Request exposes pending, processing, completed, failed-retryable, and failed-final states. A Review exists only after successful completion.
- `REV-004`: A completed Review contains dimension scores, strengths, risks, Findings, prioritized actions, and follow-up questions.
- `REV-005`: Each Finding references Workspace evidence where evidence exists.
- `REV-006`: A Review reports uncertainty or missing information rather than inventing facts.
- `REV-007`: A Review cannot mutate the working Architecture Document.
- `REV-008`: Duplicate message delivery cannot create duplicate completed Reviews or duplicate Usage Records.
- `REV-009`: A failed-retryable Review Request can be retried against the same Architecture Revision. It produces a new internal attempt but no additional monthly usage unless a usable Review completes.
- `REV-010`: A User can compare Reviews from different Architecture Revisions in the same Workspace.

### 13.10 Review Rubric

- `RUBR-001`: Reviews score requirements alignment.
- `RUBR-002`: Reviews score scalability and capacity reasoning.
- `RUBR-003`: Reviews score reliability and failure handling.
- `RUBR-004`: Reviews score data model and consistency reasoning.
- `RUBR-005`: Reviews score performance and bottleneck reasoning.
- `RUBR-006`: Reviews score security and operability.
- `RUBR-007`: Reviews score quality of trade-off reasoning.
- `RUBR-008`: Each dimension uses a documented five-point scale with evidence, not a hidden-answer comparison.

### 13.11 Billing And Entitlements

- `BILL-001`: A Free User can start Stripe Checkout for the Pro Plan.
- `BILL-002`: A Pro User can open Stripe Customer Portal.
- `BILL-003`: The backend verifies Stripe webhook signatures before processing events.
- `BILL-004`: Webhook processing is idempotent and tolerates duplicate or out-of-order events.
- `BILL-005`: Stripe is authoritative for payment state; the product's durable subscription projection drives Entitlements.
- `BILL-006`: Canceling Pro preserves owned content and applies the documented access policy at the end of the paid period.
- `BILL-007`: A User above a downgraded limit can read, edit, export, archive, or delete existing active Workspaces but cannot create or restore active Workspaces until within the limit. Free AI quotas apply after downgrade.
- `BILL-008`: Billing and quota errors state the blocked operation and available resolution without losing current work.

Stripe subscription state maps to Entitlements as follows:

| Stripe state                               | Product policy                                               |
| ------------------------------------------ | ------------------------------------------------------------ |
| `trialing`, `active`                       | Pro                                                          |
| `past_due`                                 | Pro for a configurable 7-day payment grace period, then Free |
| `incomplete`                               | Free until the first invoice is paid                         |
| `incomplete_expired`, `unpaid`, `paused`   | Free                                                         |
| `canceled` with a future paid-through date | Pro until that date, then Free                               |
| `canceled` without remaining paid time     | Free                                                         |

A payment dispute does not silently change access outside this mapping; an audited administrative suspension may override Entitlements for fraud or security response.

### 13.12 Usage And Progress

- `USAG-001`: Accepted Copilot Turns and completed Reviews create durable Usage Records in the UTC month of `accepted_at` or `completed_at` respectively. Failed AI attempts create operational cost records but do not consume monthly product quota.
- `USAG-002`: Quota checks and Usage Record creation are safe under concurrent requests.
- `USAG-003`: A User can see current monthly usage and renewal timing.
- `PROG-001`: A User can see recent activity, completed Reviews, and dimension trends.
- `PROG-002`: Progress distinguishes practice volume from Review score changes.
- `PROG-003`: The product does not claim skill improvement from insufficient or incomparable data.

### 13.13 Account Deletion And Retention

- `DATA-001`: Account deletion requires recent authentication and explicit confirmation.
- `DATA-002`: An Account Deletion Request immediately revokes all managed-identity sessions, suspends product access, and cancels subscription renewal. Already issued API JWTs expire within at most 10 minutes.
- `DATA-003`: A 7-day recovery period precedes irreversible deletion; the User receives a cancellation link through the verified email channel and must authenticate through the managed identity provider before canceling the request.
- `DATA-004`: After the recovery period, the system deletes the managed-identity User, Workspaces, Architecture Documents, Revisions, Decisions, Copilot content, Scenarios, Reviews, and progress data.
- `DATA-005`: Minimal pseudonymous billing and security records may be retained only for a documented legal, fraud, or accounting purpose and may not contain architecture or Copilot content.
- `DATA-006`: Application logs expire within 30 days unless a documented security incident requires restricted retention.
- `DATA-007`: Deleted content ages out of encrypted backups within 35 days. A pseudonymous create-only deletion tombstone is retained outside PostgreSQL for at least 70 days and replayed before restored product data becomes accessible.

## 14. Review Output Contract

A completed Review contains:

- Overall summary without a single pass/fail claim.
- Seven rubric dimension scores from 1 through 5.
- Evidence and explanation for every dimension.
- Strengths worth preserving.
- Findings with severity, category, evidence references, impact, and actionable recommendation.
- Missing information and explicit uncertainty.
- Prioritized next actions.
- Follow-up questions that encourage additional reasoning.
- Model, provider request ID, prompt version, generation time, and Architecture Revision metadata.

Finding severities are `critical`, `high`, `medium`, `low`, and `observation`. A critical Finding means the design cannot meet a stated Requirement under the described conditions, not merely that another technology might be preferable.

## 15. AI Behavior And Safety

- AI is advisory and cannot apply architecture edits.
- AI must not imply that one vendor or pattern is universally correct.
- Prompts must instruct models to distinguish supplied facts, derived reasoning, and uncertainty.
- Private context sent to OpenRouter is limited to what is needed for the requested operation.
- Passwords, tokens, billing secrets, and authentication metadata are never included in AI context.
- User-provided architecture text is treated as data, not as trusted prompt instruction.
- Structured AI output is schema-validated before display or persistence as a completed Review.
- The system records provider request IDs and safe attempt, model, token, latency, outcome, and cost metadata for audit without retaining raw provider payloads by default or exposing provider credentials.
- Provider data-retention settings and terms must be reviewed before a model is approved for private Workspace context.
- AI requests require AI Processing Consent and use only OpenRouter providers marked as not collecting user data; provider fallback is disabled. If no eligible provider is available, the operation fails recoverably without relaxing the routing policy.
- The personal beta enforces a global AI spend cap of USD 0.10 per UTC day. When the cap is reached, new AI operations remain unavailable until the next UTC day.
- A provider refusal or outage produces a recoverable product state rather than fabricated feedback.

## 16. Non-Functional Requirements

### 16.1 Performance

- `NFR-PERF-001`: Authenticated non-AI API requests target p95 server latency below 500 ms under normal operating load, excluding managed-service cold starts.
- `NFR-PERF-002`: Architecture Document autosave begins approximately one second after the last local edit.
- `NFR-PERF-003`: The canvas targets responsive interaction for documents up to the published MVP limits.
- `NFR-PERF-004`: A normal full Review targets completion within 90 seconds when the AI provider is healthy.

### 16.2 Reliability

- `NFR-REL-001`: PostgreSQL remains authoritative when Redis or RabbitMQ is unavailable.
- `NFR-REL-002`: Accepted Review jobs survive process restart and temporary broker failure through durable job and outbox state.
- `NFR-REL-003`: Consumers tolerate at-least-once message delivery.
- `NFR-REL-004`: External calls use bounded timeouts and retries appropriate to idempotency.
- `NFR-REL-005`: The MVP targets best-effort availability and makes no paid SLA claim.
- `NFR-REL-006`: Commercial production database recovery targets are an internal RPO of 24 hours and RTO of 8 hours, validated through a restore exercise before commercial launch. The personal beta makes no recovery guarantee.

### 16.3 Security And Privacy

- `NFR-SEC-001`: All production traffic uses TLS.
- `NFR-SEC-002`: Managed-identity session cookies are Secure and HttpOnly. API JWTs are short-lived, obtained only when needed, and never persisted in browser storage.
- `NFR-SEC-003`: The frontend uses a strict Content Security Policy and the API allows browser requests only from configured origins; no application-managed cookie-authenticated mutation path exists.
- `NFR-SEC-004`: Passwords use an approved adaptive password hash.
- `NFR-SEC-005`: Secrets are supplied by deployment secret stores and never committed.
- `NFR-SEC-006`: Authorization tests cover cross-User access for every owned resource category.
- `NFR-SEC-007`: Logs exclude authentication secrets, payment secrets, and full private architecture content.
- `NFR-SEC-008`: Imports, AI output, messages, and webhooks are validated as untrusted input.

### 16.4 Accessibility And Compatibility

- `NFR-ACC-001`: Core flows target WCAG 2.1 AA.
- `NFR-ACC-002`: Essential canvas operations have keyboard-accessible alternatives.
- `NFR-ACC-003`: The product supports current stable versions of major evergreen browsers.
- `NFR-ACC-004`: Main workflows remain usable on mobile, while complex canvas work may recommend a larger screen.

### 16.5 Observability

- `NFR-OBS-001`: API requests and asynchronous jobs use correlation identifiers.
- `NFR-OBS-002`: Health endpoints distinguish liveness and readiness.
- `NFR-OBS-003`: Metrics cover API errors, AI latency and cost, queue depth, retries, dead letters, webhook failures, and quota rejections.
- `NFR-OBS-004`: Operators can identify a failed Review without reading private architecture content from logs.

## 17. Initial Product Limits

Limits are configurable and validated in the backend. Initial targets are:

| Limit                                 |    Initial target |
| ------------------------------------- | ----------------: |
| Import Package file size              |             1 MiB |
| Components per Architecture Document  |               250 |
| Connections per Architecture Document |               500 |
| Requirements per Workspace            |               200 |
| Decisions per Workspace               |               200 |
| Message text                          | 20,000 characters |
| Concurrent Reviews per User           |     1 Free, 2 Pro |

These values must be tested with representative canvas and AI-context workloads before public launch.

## 18. Success Metrics

### 18.1 Activation

A newly registered User is activated after creating or starting a Workspace, adding at least three Components, recording at least one Decision, and completing a first Review.

Track:

- Median time to first Component.
- Median time to first Review.
- Activation rate by Workspace Source.

### 18.2 Engagement And Learning Signals

- Weekly active practitioners.
- Workspace resume rate.
- Scenario response completion rate.
- Review-to-revision rate.
- Four-week practice retention.
- Rubric trends across sufficiently comparable Reviews.

### 18.3 Business And Operations

- Free-to-Pro conversion.
- Pro retention.
- AI cost per active User, Copilot Turn, and completed Review.
- Review completion, retry, and dead-letter rates.
- Quota rejection and provider-limit rates.

Metrics must not present Review score changes alone as proof of learning.

## 19. Analytics Events

Initial privacy-conscious events include:

- Account created and email verified.
- Workspace created with source category.
- Requirement, Decision, Component, and Connection milestones reached.
- Scenario started and completed.
- Review requested, completed, failed, and retried.
- Review Finding opened and revision started.
- Plan boundary shown.
- Checkout started and subscription activated.

Do not send free-form architecture content, Copilot messages, email addresses, or imported documents to product analytics.

## 20. Out Of Scope

- Long-form courses and video lessons.
- Real-time multiplayer editing.
- Team Workspaces and organization accounts.
- Public architecture sharing.
- AI-generated complete architectures as the default workflow.
- Automatic image-to-architecture conversion.
- Full cloud infrastructure simulation.
- Exact cloud cost calculation.
- Community-generated Challenges.
- Full event-sourced editing history.
- Support for every external diagram format.
- A native mobile application.

## 21. Dependencies

- Vercel for the Next.js frontend.
- Northflank for the Spring Boot service.
- Neon PostgreSQL.
- Upstash Redis.
- CloudAMQP RabbitMQ.
- OpenRouter for AI model access.
- Stripe for billing.
- Google OIDC through Clerk for social login.
- GitHub OAuth through Clerk for social login.
- Resend for production transactional email.
- Cloudflare R2 for encrypted independent PostgreSQL logical backups.

Managed-service plans, quotas, data-processing terms, credential capabilities, lifecycle behavior, and pricing must be revalidated before launch. Cloudflare validation must include R2 retention behavior, create-only upload enforcement, restore throughput, and the Worker upload gateway limits.

## 22. Release Acceptance

The MVP is ready for a controlled launch when:

- Curated, custom, and supported JSON import journeys complete end to end.
- Email/password, Google, and GitHub login pass security and browser tests.
- Free limits and Stripe-based Pro Entitlements are enforced in the backend.
- Architecture autosave handles stale-version conflicts without silent data loss.
- Reviews survive restart, duplicate delivery, transient provider failure, and broker interruption.
- Completed Reviews meet the structured output contract and cite Workspace evidence.
- Account deletion, billing cancellation, and failed-provider states have documented behavior.
- Accessibility checks cover every core journey.
- Frontend, backend, infrastructure, and deployed smoke-test gates pass.
- Operational runbooks cover migrations, provider outage, dead letters, and rollback.
- Before commercial launch, an encrypted database backup has been restored successfully in a production-like environment and the RPO/RTO result recorded.
