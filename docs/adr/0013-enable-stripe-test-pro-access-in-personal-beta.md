---
status: accepted
date: 2026-08-17
---

# Enable Stripe Test-Mode Pro Access In The Personal Beta

The personal beta may expose Pro Checkout to every verified beta User while Stripe is strictly in test mode. The backend requires both `STRIPE_TEST_PRO_ENABLED=true` and `STRIPE_ALLOW_ALL_TEST_USERS=true`, and it independently requires a `sk_test_` Stripe key before allowing Checkout, billing-portal access, checkout reconciliation, or Pro entitlement projection.

This supersedes the Free-only billing boundary in ADR-0012; public registration, Clerk identity ownership, abuse controls, quotas, and the global AI spend cap remain unchanged.

## Considered Options

- Keep ordinary beta Users on Free and allow only a synthetic test subject to exercise Checkout.
- Enable real Stripe payments during the beta.
- Enable Stripe test-mode Pro access for all verified beta Users behind an explicit backend configuration gate.

The third option provides representative end-to-end billing feedback without collecting real payments. The test-mode key and two explicit flags keep this behavior separate from commercial billing.

## Consequences

- Verified beta Users can use Stripe Checkout with test cards such as `4242 4242 4242 4242`.
- Stripe test webhooks or checkout reconciliation remain authoritative before Pro entitlements are granted.
- No live Stripe key may be used with the all-test-user switch; the backend rejects non-test mode.
- The frontend must describe the beta billing path as test-mode and must not imply that real payments are collected.
- Commercial launch still requires a separate live-mode billing decision, tax review, abuse controls, and production readiness checks.
