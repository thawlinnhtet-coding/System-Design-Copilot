# 17 - Account Deletion

**What to build:** A User can create and cancel an Account Deletion Request, with access suspension and eventual deletion behavior that matches the personal-beta boundary.

**Blocked by:** 04 - Stripe Test-Mode Billing; 12 - Contextual Copilot; 15 - Review Experience; 16 - Progress And History.

**Status:** complete

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] A fresh Clerk authentication can create a deletion request that revokes managed sessions and suspends product access.
- [x] A Clerk-authenticated cancellation path restores access during the seven-day recovery period.
- [x] The beta discloses that independent backup-deletion guarantees are deferred to commercial launch.
- [x] Irreversible deletion removes identity, Workspaces, Architecture Documents, Revisions, reasoning, Copilot content, Scenarios, Reviews, and progress data while retaining only documented minimal pseudonymous legal records.
- [x] Product-content deletion is promised after recovery, while backup recovery and independent backup-deletion guarantees are explicitly excluded from the beta promise.

**Implemented:** 2026-08-16. The backend owns recovery state, access suspension, managed Clerk session revocation/user deletion, Stripe renewal cancellation, a seven-day scheduled cleanup, and a one-time Resend cancellation link sent only to the signed verified-email claim. The public-beta UI states the backup limitation explicitly. `V23__add_account_deletion_lifecycle.sql` cascades owned product records, including the source data used by Progress and History; its tombstone table deliberately contains no identity or private product content.
