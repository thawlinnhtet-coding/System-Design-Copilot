# 12 - Contextual Copilot

**What to build:** A consenting User receives bounded, advisory Copilot guidance for an owned Workspace without the Copilot mutating design content.

**Blocked by:** 06 - Workspace Reasoning; 07 - Architecture Document Contract; 09 - Curated Challenge Catalog; 11 - AI Consent And Provider Boundary.

**Status:** ready-for-agent

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] Copilot context is authorized, bounded, injection-resistant, and excludes secrets and unrelated Workspace content.
- [ ] Before the first operation, the User can inspect the bounded Workspace categories and privacy exclusions that will be used for context.
- [ ] Challenge Workspace Copilot turns can use the snapped Challenge Version as bounded context without exposing a complete reference architecture.
- [ ] Accepted Copilot Turns stream or complete reliably and create usage exactly once.
- [ ] Retry, refusal, timeout, quota, disconnect, and unavailable-provider states are clear to the User.
- [ ] Only accepted Copilot output creates monthly product usage; refusal, timeout, malformed output, unavailable provider, and retryable failure do not create duplicate usage.
