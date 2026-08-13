# 15 - Review Experience

**What to build:** A User can submit a Review, follow its status, inspect evidence-grounded feedback, retry eligible failures, and compare Reviews from the same Workspace.

**Blocked by:** 14 - Reliable Review Processing.

**Status:** ready-for-agent

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] The interface displays pending, processing, completed, retryable failure, and final failure states.
- [ ] Review submission confirms the immutable Architecture Revision checkpoint while the User can continue practicing.
- [ ] Completed Reviews lead with interpretation, strengths, risks, evidence-linked Findings, uncertainty, and prioritized actions.
- [ ] Reviews show the seven dimension scores without a composite overall score.
- [ ] A User can inspect linked evidence and manually carry a Finding into a Requirement, Assumption, Decision, or next-action list without automatic Workspace mutation.
- [ ] Review history is a Workspace-scoped immutable timeline, and two completed Reviews from that Workspace can be compared.
- [ ] Retrying a failed Review reuses its Architecture Revision without duplicate product usage.
