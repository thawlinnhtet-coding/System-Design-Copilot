# 12 - Contextual Copilot

**What to build:** A consenting User receives bounded, advisory Copilot guidance for an owned Workspace without the Copilot mutating design content.

**Blocked by:** 06 - Workspace Reasoning; 07 - Architecture Document Contract; 11 - AI Consent And Provider Boundary.

**Status:** ready-for-agent

- [ ] Copilot context is authorized, bounded, injection-resistant, and excludes secrets and unrelated Workspace content.
- [ ] Accepted Copilot Turns stream or complete reliably and create usage exactly once.
- [ ] Retry, refusal, timeout, quota, disconnect, and unavailable-provider states are clear to the User.
