---
status: accepted
date: 2026-08-02
---

# Use Stripe-Backed Subscription Projections And Backend Entitlements

Use Stripe Checkout and Customer Portal for Pro subscriptions. Treat Stripe as authoritative for payment state, project verified webhook events into PostgreSQL, and let backend application policy evaluate Plan Entitlements and durable Usage Records.

## Considered Options

- Build subscription collection and payment management directly.
- Query Stripe during every protected operation.
- Trust the frontend's displayed Plan.
- Maintain an idempotent local subscription projection from Stripe webhooks.

Building payments directly creates avoidable security and compliance risk. Synchronous Stripe checks add latency and make core use dependent on provider availability. Frontend state is not an authorization boundary. A durable projection permits fast policy checks and controlled behavior during webhook delay or Stripe outage.

## Consequences

- Webhook signatures must be verified against the raw body and event IDs processed idempotently.
- Duplicate and out-of-order events require explicit handling and reconciliation.
- Entitlement values remain server-configurable rather than scattered constants.
- Downgrade preserves user content while blocking creation or restoration beyond current limits.
- Marketing-level unlimited Pro use still has non-marketing concurrency, abuse, and spend controls.
