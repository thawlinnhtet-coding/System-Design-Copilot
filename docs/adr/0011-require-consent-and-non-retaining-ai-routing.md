---
status: accepted
date: 2026-08-04
---

# Require Consent And Non-Retaining AI Routing

Require a User's revocable AI Processing Consent before sending private Workspace context to OpenRouter. Each request restricts routing to providers marked as not collecting user data and disables provider fallback; when no eligible provider is available, the product reports a recoverable AI-unavailable state rather than relaxing the policy.

## Considered Options

- Allow OpenRouter's default routing without a product consent boundary.
- Obtain consent but allow providers that may retain or train on content.
- Require consent and route only to non-retaining providers without fallback.

Default routing can send private Workspace context to providers with different data practices. Requiring consent and non-retaining routing preserves user control and limits exposure, even though it can increase price and make AI temporarily unavailable.

## Consequences

- Consent state and the presented policy version are durable product records; withdrawal blocks future AI operations but cannot retract content already sent to a provider.
- The selected budget models are used only when an eligible provider is available under this routing policy.
- AI failure handling must include no-eligible-provider behavior and must never silently relax data-routing restrictions.
