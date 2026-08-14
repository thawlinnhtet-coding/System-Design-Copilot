# 25 - Public Surface And Authentication UI Parity

**What to build:** Implement the approved public landing, navigation, and Clerk authentication journeys from the repository-root `ui_design` Pencil artifact, using the existing backend identity and entitlement boundaries.

**Blocked by:** 02 - Clerk Identity Boundary.

**Status:** complete

- [x] The public landing route matches the approved `ui_design` desktop and mobile composition: navigation, hero, four-stage practice demonstration, outcomes, challenge examples, personal-beta disclosure, final action, and footer.
- [x] Public navigation exposes `How it works`, `Challenges`, `Sign in`, and `Explore Challenges`; each action leads to the approved product route or in-page destination.
- [x] The shared structural product mark uses the approved public asset and remains consistent on landing, authentication, and authenticated navigation.
- [x] Dedicated branded Clerk routes cover sign-in, account creation, email verification, password recovery/reset, retryable authentication unavailability, and the preserved Challenge or intended destination context specified in `ui_design`.
- [x] Clerk remains responsible for email/password, social providers, verification, recovery, and sessions; frontend code never receives or stores passwords.
- [x] Every state has accessible labels, focus treatment, error/retry feedback, and an approved mobile presentation.
- [x] Playwright verifies the public navigation destinations, landing demonstration state switching, auth-route entry, and critical recovery/error routes using non-production credentials or provider mocks.

## Comments

2026-08-14: Implemented and verified in the `feat/ticket-25-public-surface-ui-parity` worktree. Updated public/authentication surfaces, structural branding, navigation semantics, Clerk appearance, recovery/unavailability states, and responsive accessibility. Frontend lint/typecheck/unit tests/build passed; browser assertions passed using system Chrome (the Playwright-managed browser is unavailable in this environment).

## Implementation notes

`ui_design` is the visual and interaction source of truth. `DESIGN.md` supplies durable rules and implementation notes; if they differ, follow `ui_design` and update `DESIGN.md` in the same change. This ticket does not replace Ticket 02's backend Clerk JWT validation or ownership boundary.
