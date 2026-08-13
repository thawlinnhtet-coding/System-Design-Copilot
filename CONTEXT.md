# System Design Copilot Domain Glossary

This glossary defines the canonical product language. It intentionally excludes implementation details.

## Terms

### Architecture Document

The user's editable representation of a system, including components, connections, boundaries, and component properties.

### Architecture Canvas

The primary Workspace surface for viewing and editing an Architecture Document. The Architecture Canvas is not a standalone product object or Workspace type.

### Architecture Revision

An immutable snapshot of the Workspace design state used for evaluation. It includes the Architecture Document and the applicable Requirements, Assumptions, Decisions, and completed Scenario context. A Review evaluates exactly one Architecture Revision.

### AI Processing Consent

A User's revocable permission for the product to send bounded private Workspace context to an external AI provider for an AI operation. Withdrawing consent blocks future AI operations but cannot retract context previously sent to a provider.

### Account Deletion Request

A User's reversible request to permanently delete the User's identity and private product content after a defined recovery period. It immediately suspends product access and begins the recovery period but is not itself irreversible deletion.

### Assumption

An explicit condition the user relies on while designing, such as expected traffic, acceptable latency, or delivery guarantees.

### Challenge

A curated system design prompt containing a problem, initial requirements, constraints, and optional Scenarios. A Challenge is a reusable, versioned template and is not owned by a learner.

### Challenge Version

An immutable published version of a Challenge's problem, constraints, skill tags, estimated practice time, and optional Scenarios. A Challenge Workspace snapshots one Challenge Version when it is created.

### Topic Pack

A curated grouping of individual Challenges organized around a system-design topic and ordered by skill progression. Topic Packs are the canonical future content structure. Interview Packs may later reuse Challenges from Topic Packs as timed, interview-specific sequences.

### Challenge Difficulty

A Challenge's reasoning-load classification. Foundation focuses on one dominant path and an explicit trade-off; Intermediate combines multiple flows, quantified scale, and competing trade-offs; Advanced combines interacting failure, consistency, security, or multi-region constraints with ambiguous trade-offs.

### Skill Coverage

The mapping between Challenges and the reasoning skills they intentionally practice. Skill Coverage uses a granular learning taxonomy while progress and Review reporting may use broader Review dimensions.

### Component

An element in an Architecture Document with a stable Component Type, editable label, optional provider metadata, and properties. Examples include a client, service, database, cache, queue, gateway, or external system.

### Component Type

A vendor-neutral semantic category for a Component, such as DNS, CDN, API Gateway, Service, Relational Database, Queue, Identity Provider, or External API. Component Types provide stable meaning for icons, validation, and Review evidence; labels and provider metadata remain editable.

### Connection

A typed, directed relationship between Components that describes communication or data flow, including a Connection Intent such as request/response, event publish/consume, replication, authentication, or data transfer.

### Connection Intent

The stable semantic meaning of a Connection, such as request/response, DNS resolution, data read/write, event publish/consume, queue delivery, stream, replication, authentication, or file/object transfer. Protocol and guarantees provide additional detail.

### Architecture Boundary

A labeled container in an Architecture Document that expresses deployment, network, region, availability, or trust scope for nested Components and Boundaries. A Boundary is not a runtime Component.

### Copilot Turn

One user message and the contextual guidance produced in response. A Copilot Turn guides reasoning rather than supplying a complete design by default.

### Decision

A recorded architectural choice with its rationale, alternatives, assumptions, and trade-offs.

### Entitlement

A capability or usage allowance granted to a User by the User's current Plan.

### Finding

An evidence-linked strength, risk, omission, or recommendation contained in a Review.

### Import Package

A portable, versioned representation of design content that can create a new Workspace. It may contain Requirements, Assumptions, Decisions, and an Architecture Document, but never identity, ownership, Plan, Usage Record, provider, or existing Review data.

### Plan

The commercial access level for a User. The initial Plans are Free and Pro.

### Requirement

A functional or quality need that a design is expected to satisfy.

### Unresolved Question

A persisted uncertainty in a Workspace that records why the answer matters and can later be resolved with an answer, related Requirement or Assumption, and optional resulting Decision.

### Review

An immutable, structured evaluation of one Architecture Revision against its Requirements, Assumptions, Decisions, and applicable Challenge context.

### Review Request

A request to evaluate one Architecture Revision. A Review Request has a processing lifecycle and produces at most one Review.

### Review Brief

Persisted context for an Architecture Review Workspace containing the existing system description and the current review goal. Known Requirements and Assumptions remain normal Workspace reasoning records.

### Scenario

A changed requirement, traffic condition, incident, or failure that asks the user to adapt or defend a design.

### Usage Record

A durable record that a metered product operation was accepted or completed for a User.

### User

An individual learner or engineer with an identity, Plan, Workspaces, and progress history.

### Workspace

A private, user-owned, resumable environment that brings together Requirements, Assumptions, an Architecture Document, Decisions, Scenarios, Copilot Turns, and Reviews. Every Workspace has one fixed Workspace Type and one Workspace Source.

### Workspace Archive

The read-only lifecycle state of a Workspace after it is removed from active practice. An archived Workspace remains owned and exportable, but editing, Copilot use, and Review submission require restoration to Active.

### Workspace Type

The fixed practice mode selected when a Workspace is created: Challenge Workspace, Custom Design Workspace, or Architecture Review Workspace. Types share the core Workspace model but provide different starting context and guided capabilities.

### Workspace Source

How a Workspace began: from a curated Challenge, a Custom design, an Import Package, or Manual Recreation. The source records provenance separately from Workspace Type.

## Invariants

- A Workspace belongs to exactly one User in the initial product.
- A Workspace Type is fixed at creation and cannot be changed in place.
- An Archived Workspace is read-only and exportable; it must be restored before editing, Copilot use, or Review submission.
- A Review Request targets exactly one immutable Architecture Revision and produces at most one Review.
- A Review evaluates exactly one immutable Architecture Revision.
- Editing an Architecture Document does not alter an existing Architecture Revision or Review.
- A Finding references evidence from the reviewed Workspace whenever that evidence exists.
- A Challenge may seed many Workspaces but cannot access their private content.
- An Architecture Review Workspace may contain multiple editable Revisions and Reviews.
- A Connection is directed between two distinct Components; parallel flows may represent distinct architectural purposes.
- An Entitlement is enforced by the product, not inferred from what the interface displays.
