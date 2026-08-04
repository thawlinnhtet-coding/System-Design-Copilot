# System Design Copilot Domain Glossary

This glossary defines the canonical product language. It intentionally excludes implementation details.

## Terms

### Architecture Document

The user's editable representation of a system, including components, connections, boundaries, and component properties.

### Architecture Revision

An immutable snapshot of the Workspace design state used for evaluation. It includes the Architecture Document and the applicable Requirements, Assumptions, Decisions, and completed Scenario context. A Review evaluates exactly one Architecture Revision.

### AI Processing Consent

A User's revocable permission for the product to send bounded private Workspace context to an external AI provider for an AI operation. Withdrawing consent blocks future AI operations but cannot retract context previously sent to a provider.

### Account Deletion Request

A User's reversible request to permanently delete the User's identity and private product content after a defined recovery period. It immediately suspends product access and begins the recovery period but is not itself irreversible deletion.

### Assumption

An explicit condition the user relies on while designing, such as expected traffic, acceptable latency, or delivery guarantees.

### Challenge

A curated system design prompt containing a problem, initial requirements, constraints, and optional scenarios. A Challenge is a reusable template and is not owned by a learner.

### Component

An element in an Architecture Document, such as a client, service, database, cache, queue, gateway, or external system.

### Connection

A directed relationship between Components that describes communication or data flow.

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

### Review

An immutable, structured evaluation of one Architecture Revision against its Requirements, Assumptions, Decisions, and applicable Challenge context.

### Review Request

A request to evaluate one Architecture Revision. A Review Request has a processing lifecycle and produces at most one Review.

### Scenario

A changed requirement, traffic condition, incident, or failure that asks the user to adapt or defend a design.

### Usage Record

A durable record that a metered product operation was accepted or completed for a User.

### User

An individual learner or engineer with an identity, Plan, Workspaces, and progress history.

### Workspace

A private, user-owned, resumable environment that brings together Requirements, Assumptions, an Architecture Document, Decisions, Scenarios, Copilot Turns, and Reviews.

### Workspace Source

How a Workspace began: from a curated Challenge, as a custom design, or from an Import Package.

## Invariants

- A Workspace belongs to exactly one User in the initial product.
- A Review Request targets exactly one immutable Architecture Revision and produces at most one Review.
- A Review evaluates exactly one immutable Architecture Revision.
- Editing an Architecture Document does not alter an existing Architecture Revision or Review.
- A Finding references evidence from the reviewed Workspace whenever that evidence exists.
- A Challenge may seed many Workspaces but cannot access their private content.
- An Entitlement is enforced by the product, not inferred from what the interface displays.
