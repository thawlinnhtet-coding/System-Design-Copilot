# 03 - Free Plan And Usage Policy

**What to build:** Backend-enforced Free Plan Entitlements and durable usage accounting that a signed-in User can inspect.

**Blocked by:** 02 - Clerk Identity Boundary.

**Status:** completed

- [x] Authenticated Users see their Free Plan and current usage.
- [x] Workspace and AI allowances are enforced transactionally in backend use cases.
- [x] Concurrent requests cannot exceed the configured allowance through a race.

## Approved UI alignment

The approved Account and in-context usage surfaces must show the current Free Plan, relevant allowance, renewal context, and localized quota recovery actions. Loading, unavailable, and quota-exceeded states must be explicit and accessible; displayed usage remains informational and never replaces backend enforcement.
