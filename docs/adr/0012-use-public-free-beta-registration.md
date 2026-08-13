---
status: accepted
date: 2026-08-08
---

# Use Public Free Beta Registration

Allow public registration for the personal beta on the Free Plan. Clerk remains the identity authority, while the backend applies progressive abuse controls, quotas, concurrency limits, and the global AI spend cap. Stripe remains in test mode and ordinary beta Users do not receive paid Pro access.

## Considered Options

- Keep the beta invite-only through Clerk.
- Require a product access-code or Invitation entity before Workspace creation.
- Allow public Free registration with layered abuse and spend controls.

Public Free registration reduces onboarding friction and produces more representative practice feedback. It increases exposure to automated creation, extraction, and AI spend abuse, so the product must add controls at identity, API, entitlement, and provider-budget boundaries rather than relying on invitation scarcity.

## Consequences

- The product does not create an Invitation entity or invitation API for the beta.
- Email verification is required before AI operations or billing changes, while ordinary practice remains available to authenticated Users.
- Clerk protects registration and token issuance; the backend rate-limits sensitive operations by authenticated User and request origin where appropriate.
- The public beta remains Free-only for ordinary Users, Stripe remains test-only, and the USD 0.10 global daily AI cap remains a hard stop.
- Commercial launch still requires recovery, observability, abuse-control, hosting, broker, and real-payment gates.
