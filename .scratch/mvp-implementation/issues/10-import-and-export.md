# 10 - Import And Export

**What to build:** A User can safely validate and import a portable design payload and export portable content from an owned Workspace.

**Blocked by:** 06 - Workspace Reasoning; 07 - Architecture Document Contract; 19 - Workspace Types And Sources.

**Status:** ready-for-agent

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] Unsupported versions, unsafe content, excessive size, and server-owned fields receive actionable validation errors.
- [ ] Browser pre-validation shows a safe portable-content preview before server submission.
- [ ] Validation errors identify a safe JSON path, rejection reason, and correction without unnecessarily echoing private content.
- [ ] Import cannot affect ownership, identity, billing, Review, provider, or usage records.
- [ ] A valid Import Package produces portable Workspace starting content for the owning creation flow without deciding Workspace Type or Review behavior.
- [ ] Export provides a portable-content preview before downloading only Requirements, Assumptions, Decisions, and Architecture Document content.
- [ ] Export explicitly excludes identity, billing, Usage Records, provider metadata, and Reviews.
