# 18 - Personal-Beta Release

**What to build:** The complete product can be verified as a public Free-Plan, best-effort personal beta with transparent operational and cost boundaries.

**Blocked by:** 08 - Architecture Canvas; 09 - Curated Challenge Catalog; 10 - Import And Export; 13 - Scenarios; 16 - Progress And History; 17 - Account Deletion; 22 - Billing And Upgrade UX; 23 - Workspace Archive And Deletion UX; 24 - Public Free Beta Access Policy; 25 - Public Surface And Authentication UI Parity.

**Status:** ready-for-agent

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] Public Clerk registration, Free-only access, progressive abuse/rate-limit controls, Stripe test-mode guardrails, AI consent, and beta disclosures work together in deployed smoke tests.
- [ ] The personal beta communicates its no-recovery guarantee and USD 0.10 daily AI cap.
- [ ] Production-only payment, backup, broker, and recovery controls remain disabled or clearly deferred.
- [ ] Upgrade boundaries explain preserved content and beta/test-mode billing without promising paid Pro access to personal-beta participants.
- [ ] The beta enforces a hard USD 0.10 UTC daily AI cap and safe stop behavior.
- [ ] Safe correlation, queue, retry, dead-letter, quota, provider, and cost telemetry is available without private Workspace content.
- [ ] Commercial launch remains blocked on commercial hosting, appropriate broker capacity, real payment enablement, independent backups, restore drill, deletion tombstones, recovery targets, and production observability.
