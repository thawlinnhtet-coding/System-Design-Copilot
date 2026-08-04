# 17 - Account Deletion

**What to build:** A User can create and cancel an Account Deletion Request, with access suspension and eventual deletion behavior that matches the personal-beta boundary.

**Blocked by:** 04 - Stripe Test-Mode Billing; 12 - Contextual Copilot; 15 - Review Experience; 16 - Progress And History.

**Status:** ready-for-agent

- [ ] A fresh Clerk authentication can create a deletion request that revokes managed sessions and suspends product access.
- [ ] A Clerk-authenticated cancellation path restores access during the seven-day recovery period.
- [ ] The beta discloses that independent backup-deletion guarantees are deferred to commercial launch.
