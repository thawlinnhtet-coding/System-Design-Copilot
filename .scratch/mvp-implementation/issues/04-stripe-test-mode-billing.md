# 04 - Stripe Test-Mode Billing

**What to build:** A synthetic local or staging test account can complete Stripe test-mode billing and receive a backend-projected Pro Entitlement after a verified webhook.

**Blocked by:** 03 - Free Plan And Usage Policy.

**Status:** completed

- [x] Checkout, webhook verification, idempotency, and subscription projection work in Stripe test mode.
- [x] Duplicate and out-of-order webhook events do not duplicate or regress Entitlements.
- [x] Personal-beta participants cannot receive paid Pro access.
