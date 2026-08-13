# 21 - Architecture Review Entry

**What to build:** Create Architecture Review Workspaces from an imported architecture or a manual Review Brief without changing the shared Workspace and Review model.

**Blocked by:** 06 - Workspace Reasoning; 07 - Architecture Document Contract; 08 - Architecture Canvas; 10 - Import And Export; 19 - Workspace Types And Sources.

**Status:** ready-for-agent

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] A User provides a Review Goal before an Import Package creates an Import Package-sourced Architecture Review Workspace.
- [ ] Import shows a validated portable-content preview before requesting the Review Goal and creating a new Workspace.
- [ ] Imported Requirements, Assumptions, Decisions, and Architecture Document content remain editable starting context and never include existing Review or ownership data.
- [ ] Manual recreation requires a persisted Review Brief with System Description and Review Goal, plus optional Known Requirements and Assumptions.
- [ ] Manual recreation creates a blank, editable Architecture Review Workspace with Manual Recreation as its Source.
- [ ] The created Workspace is ready for the later Architecture Revision and Review capabilities owned by tickets 07, 14, and 15.
- [ ] The entry flow clearly explains the next action: inspect imported content or reconstruct the existing architecture.
- [ ] Ownership, Entitlement, validation, AI consent, and Review authorization remain enforced by their owning boundaries.
