# 03 - Free Plan And Usage Policy

**What to build:** Backend-enforced Free Plan Entitlements and durable usage accounting that a signed-in User can inspect.

**Blocked by:** 02 - Clerk Identity Boundary.

**Status:** ready-for-agent

- [ ] Authenticated Users see their Free Plan and current usage.
- [ ] Workspace and AI allowances are enforced transactionally in backend use cases.
- [ ] Concurrent requests cannot exceed the configured allowance through a race.
