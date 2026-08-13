# 24 - Public Free Beta Access Policy

**What to build:** A public Free beta User can begin private practice with progressive abuse controls while sensitive AI and billing capabilities remain gated by verification and product policy.

**Blocked by:** 02 - Clerk Identity Boundary; 03 - Free Plan And Usage Policy; 11 - AI Consent And Provider Boundary.

**Status:** ready-for-agent

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] Public Free registration uses Clerk without a product Invitation entity or access-code gate.
- [ ] Email/password, Google, and GitHub remain Clerk-managed sign-in methods.
- [ ] An authenticated but unverified User can browse, create, edit, and save private Workspaces but cannot use Copilot, submit Review AI work, or change billing until email ownership is verified.
- [ ] Account linking occurs only through Clerk after verified ownership; matching email claims never merge product Users in the backend.
- [ ] Current-session and all-session sign-out are available through Clerk, and already-issued API JWTs expire within at most 10 minutes.
- [ ] Clerk protects registration and token issuance while backend controls apply progressive request-origin/User rate limits, concurrency caps, quotas, and adaptive challenges when risk signals require them.
