# 23 - Workspace Archive And Deletion UX

**What to build:** A User can safely archive, restore, and permanently delete a Workspace while understanding the read-only archive state, active-capacity consequences, and irreversible deletion consequences.

**Blocked by:** 03 - Free Plan And Usage Policy; 05 - Custom Workspace Lifecycle; 19 - Workspace Types And Sources.

**Status:** complete

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] Archiving removes a Workspace from active capacity and makes it read-only and exportable.
- [x] Archived Workspaces block editing, Copilot use, and Review submission with a clear Restore action.
- [x] Restoring requires active-Workspace allowance and returns the Workspace to its prior editable practice state.
- [x] Permanent deletion requires typing the Workspace name and explicit confirmation of irreversible content removal.
- [x] A User above a downgraded active-Workspace limit retains access to existing active content but cannot create or restore additional active Workspaces.
- [x] Ownership, failed restore, failed deletion, and quota errors are visible without losing current work.

## Comments

- 2026-08-15: Completed in `issue/23-workspace-archive` at `d8d7289`. Added archive confirmation and read-only restore states from the approved design, backend name-confirmed permanent deletion with structured failure feedback, generated OpenAPI client types, and component/API coverage. Added the authenticated Playwright archive/restore/delete journey. Backend workspace tests (21), frontend typecheck, and focused frontend tests (4) pass; the Playwright journey is discovered and skips locally until `PLAYWRIGHT_AUTH_STATE` is supplied.
