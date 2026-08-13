# 23 - Workspace Archive And Deletion UX

**What to build:** A User can safely archive, restore, and permanently delete a Workspace while understanding the read-only archive state, active-capacity consequences, and irreversible deletion consequences.

**Blocked by:** 03 - Free Plan And Usage Policy; 05 - Custom Workspace Lifecycle; 19 - Workspace Types And Sources.

**Status:** ready-for-agent

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] Archiving removes a Workspace from active capacity and makes it read-only and exportable.
- [ ] Archived Workspaces block editing, Copilot use, and Review submission with a clear Restore action.
- [ ] Restoring requires active-Workspace allowance and returns the Workspace to its prior editable practice state.
- [ ] Permanent deletion requires typing the Workspace name and explicit confirmation of irreversible content removal.
- [ ] A User above a downgraded active-Workspace limit retains access to existing active content but cannot create or restore additional active Workspaces.
- [ ] Ownership, failed restore, failed deletion, and quota errors are visible without losing current work.
