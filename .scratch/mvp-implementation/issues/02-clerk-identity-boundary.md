# 02 - Clerk Identity Boundary

**What to build:** Invite-only Clerk authentication for the personal beta, with durable User association and a Spring API boundary that accepts only valid Clerk JWTs.

**Blocked by:** 01 - Walking Skeleton.

**Status:** ready-for-agent

- [ ] An invited User can register, sign in, restore a managed session, and sign out.
- [ ] The API validates Clerk issuer, audience, authorized party, expiry, signature, and subject.
- [ ] Invalid tokens and cross-User access are rejected through observable API behavior.
