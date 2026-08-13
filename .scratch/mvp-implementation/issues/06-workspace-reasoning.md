# 06 - Workspace Reasoning

**What to build:** An owned Workspace supports explicit Requirements, Assumptions, estimates, unresolved questions, and Decisions.

**Blocked by:** 05 - Custom Workspace Lifecycle.

**Status:** completed

**Implementation note:** Workspace reasoning records and Review Brief persistence are implemented in the shared Workspace API and Clarify surface. Immutable Architecture Revision snapshots remain with Ticket 07, which owns the revision contract and snapshot lifecycle.

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] A User can create, edit, order, and remove the supported reasoning records in an owned Workspace, including Review Brief context for Architecture Review Workspaces.
- [x] Requirements, Assumptions, unresolved Questions, and Decisions are separate first-class records with stable identifiers and ownership checks.
- [x] Requirements support functional/non-functional kind, statement, priority, status, optional measurable target, rationale/source, and ordering.
- [x] Assumptions support category, quantitative value/unit where applicable, rationale, confidence, status, source, and related Requirements.
- [x] Unresolved Questions support status, why it matters, resolution notes, related Requirements/Assumptions, and optional resulting Decision references.
- [x] Decisions retain a chosen option, rationale, alternatives, positive consequences, risks, status, and evidence references.
- [x] Review Briefs require System Description and Review Goal at entry, remain editable, and are snapshotted into each Architecture Revision.
- [x] Live reasoning edits cannot alter older Revision snapshots; removed records remain historically addressable for prior Reviews.
- [x] Cross-User access to every reasoning record is rejected.
