# 21 - Architecture Review Entry

**What to build:** Create Architecture Review Workspaces from an imported architecture or a manual Review Brief without changing the shared Workspace and Review model.

**Blocked by:** 06 - Workspace Reasoning; 07 - Architecture Document Contract; 08 - Architecture Canvas; 10 - Import And Export; 19 - Workspace Types And Sources.

**Status:** complete

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] A User provides a Review Goal before an Import Package creates an Import Package-sourced Architecture Review Workspace.
- [x] Import shows a validated portable-content preview before requesting the Review Goal and creating a new Workspace.
- [x] Imported Requirements, Assumptions, Decisions, and Architecture Document content remain editable starting context and never include existing Review or ownership data.
- [x] Manual recreation requires a persisted Review Brief with System Description and Review Goal, plus optional Known Requirements and Assumptions.
- [x] Manual recreation creates a blank, editable Architecture Review Workspace with Manual Recreation as its Source.
- [x] The created Workspace is ready for the later Architecture Revision and Review capabilities owned by tickets 07, 14, and 15.
- [x] The entry flow clearly explains the next action: inspect imported content or reconstruct the existing architecture.
- [x] Ownership, Entitlement, validation, AI consent, and Review authorization remain enforced by their owning boundaries.

## Comments

2026-08-15: Added the manual recreation API and transactional entry service, persisted Review Brief and optional known reasoning, exposed the Practice architecture-review entry flow, and regenerated the OpenAPI TypeScript contract. The command validates the form at the React Hook Form/Zod boundary, enforces the persisted Workspace description limit, and uses a durable idempotency key so retries return the same Workspace. Existing import validation now has a dedicated entry link and remains server-validated before Workspace creation; an authenticated Playwright journey is available when `PLAYWRIGHT_AUTH_STATE` is configured.
