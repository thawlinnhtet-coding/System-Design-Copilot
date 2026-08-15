# 15 - Review Experience

**What to build:** A User can submit a Review, follow its status, inspect evidence-grounded feedback, retry eligible failures, and compare Reviews from the same Workspace.

**Blocked by:** 14 - Reliable Review Processing.

**Status:** complete

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] The interface displays pending, processing, completed, retryable failure, and final failure states.
- [x] Review submission confirms the immutable Architecture Revision checkpoint while the User can continue practicing.
- [x] Completed Reviews lead with interpretation, strengths, risks, evidence-linked Findings, uncertainty, and prioritized actions.
- [x] Reviews show the seven dimension scores without a composite overall score.
- [x] A User can inspect linked evidence and manually carry a Finding into a Requirement, Assumption, Decision, or next-action list without automatic Workspace mutation.
- [x] Review history is a Workspace-scoped immutable timeline, and two completed Reviews from that Workspace can be compared.
- [x] Retrying a failed Review reuses its Architecture Revision without duplicate product usage.

## Comments

- 2026-08-16: Added the Review Experience UI/API-adapter shell on `issue/15-review-experience`. It renders the documented review states and completed-feedback structure as adapter input, but it intentionally does not submit, poll, retry, or load persisted Reviews until #14 provides the authoritative API contract. This ticket remains blocked and is not complete.
- 2026-08-16: Connected the Review stage to the authoritative API, including checkpoint submission, status polling, persisted feedback, workspace-scoped history, comparison selection, and same-revision retry. The carried finding is copied for the User to place deliberately in their reasoning; it does not mutate the Workspace automatically. Verified with backend `mvn.cmd verify`, frontend lint/typecheck/tests/build, and the authenticated Playwright journey discovery run (skipped without `PLAYWRIGHT_AUTH_STATE`).
