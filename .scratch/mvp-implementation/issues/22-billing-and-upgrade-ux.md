# 22 - Billing And Upgrade UX

**What to build:** A User understands Plan boundaries and can enter the configured Stripe test-mode flow without losing access to existing content or seeing unverified Pro access.

**Blocked by:** 03 - Free Plan And Usage Policy; 04 - Stripe Test-Mode Billing.

**Status:** ready-for-agent

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] Plan-boundary UI explains the blocked capability, current usage, reset timing, and which existing Workspaces remain available.
- [ ] Account billing UI shows current Plan, Workspace/AI allowances, renewal or paid-through date, and the beta/test-mode boundary.
- [ ] A Free User can start Checkout with a caller-generated idempotency key; the UI handles unavailable, forbidden, and rate-limited states without hiding content.
- [ ] Checkout return shows pending verification until backend Entitlements reflect the verified Stripe webhook projection.
- [ ] A Pro User can open the Customer Portal.
- [ ] Cancellation preserves Pro access through the paid-through date and preserves owned content after downgrade.
- [ ] Personal-beta participants cannot receive paid Pro access, and the UI communicates that restriction clearly.
