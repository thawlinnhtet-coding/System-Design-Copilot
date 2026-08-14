# 10 - Import And Export

**What to build:** A User can safely validate and import a portable design payload and export portable content from an owned Workspace.

**Blocked by:** 06 - Workspace Reasoning; 07 - Architecture Document Contract; 19 - Workspace Types And Sources.

**Status:** complete

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] Unsupported versions, unsafe content, excessive size, and server-owned fields receive actionable validation errors.
- [x] Browser pre-validation shows a safe portable-content preview before server submission.
- [x] Validation errors identify a safe JSON path, rejection reason, and correction without unnecessarily echoing private content.
- [x] Import cannot affect ownership, identity, billing, Review, provider, or usage records.
- [x] A valid Import Package produces portable Workspace starting content for the owning creation flow without deciding Workspace Type or Review behavior.
- [x] Export provides a portable-content preview before downloading only Requirements, Assumptions, Decisions, and Architecture Document content.
- [x] Export explicitly excludes identity, billing, Usage Records, provider metadata, and Reviews.

## Comments

- Implemented and merged into `main` in commits `bd8466c` and `1535474`.
- Frontend typecheck and 55 frontend tests passed; the full backend Maven test suite passed.
- The implementation review recorded follow-up hardening for the final import-to-Workspace handoff, generated contract workflow, rate limiting, ownership coverage, and the Playwright journey.
- The follow-up implementation adds the authenticated import handoff, structured path/reason/correction errors, bounded per-user rate limiting, ownership coverage, and the browser journey specification.
