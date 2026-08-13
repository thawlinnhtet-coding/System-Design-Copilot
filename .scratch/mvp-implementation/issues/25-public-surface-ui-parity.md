# 25 - Public Surface And Authentication UI Parity

**What to build:** Implement the approved public landing, navigation, and Clerk authentication journeys from the repository-root `ui_design` Pencil artifact, using the existing backend identity and entitlement boundaries.

**Blocked by:** 02 - Clerk Identity Boundary.

**Status:** ready-for-agent

- [ ] The public landing route matches the approved `ui_design` desktop and mobile composition: navigation, hero, four-stage practice demonstration, outcomes, challenge examples, personal-beta disclosure, final action, and footer.
- [ ] Public navigation exposes `How it works`, `Challenges`, `Sign in`, and `Explore Challenges`; each action leads to the approved product route or in-page destination.
- [ ] The shared structural product mark uses the approved public asset and remains consistent on landing, authentication, and authenticated navigation.
- [ ] Dedicated branded Clerk routes cover sign-in, account creation, email verification, password recovery/reset, retryable authentication unavailability, and the preserved Challenge or intended destination context specified in `ui_design`.
- [ ] Clerk remains responsible for email/password, social providers, verification, recovery, and sessions; frontend code never receives or stores passwords.
- [ ] Every state has accessible labels, focus treatment, error/retry feedback, and an approved mobile presentation.
- [ ] Playwright verifies the public navigation destinations, landing demonstration state switching, auth-route entry, and critical recovery/error routes using non-production credentials or provider mocks.

## Implementation notes

`ui_design` is the visual and interaction source of truth. `DESIGN.md` supplies durable rules and implementation notes; if they differ, follow `ui_design` and update `DESIGN.md` in the same change. This ticket does not replace Ticket 02's backend Clerk JWT validation or ownership boundary.
