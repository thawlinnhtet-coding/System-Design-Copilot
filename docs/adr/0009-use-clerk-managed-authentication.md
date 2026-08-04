---
status: accepted
date: 2026-08-04
---

# Use Clerk For Managed Authentication

Use Clerk for MVP registration, email verification, credential recovery, social login, and session lifecycle. The browser uses Clerk's frontend integration and Spring Boot verifies Clerk-issued session tokens, maps the immutable Clerk user ID to a durable product User, and remains the policy boundary for product authorization, Workspace ownership, Entitlements, quotas, and billing.

## Considered Options

- Continue with application-owned authentication in Spring Security.
- Use Auth0.
- Self-host Keycloak.
- Use Clerk-managed authentication.

Application-owned authentication would require implementing and operating credential, session, recovery, verification, and social-provider security workflows. Auth0's paid B2C pricing is less compatible with the MVP budget, while self-hosted Keycloak transfers operational work to the product. Clerk provides the required email/password and social identity capability within its Hobby-tier limits while leaving business authorization in the backend.

## Consequences

- Clerk is the identity authority; PostgreSQL stores only the durable internal User and the immutable external Clerk user ID needed to associate product data.
- Spring Boot does not receive or store passwords, verification tokens, reset tokens, refresh tokens, or OAuth client secrets for end-user authentication.
- The existing backend-owned authentication decision is superseded. Product requirements, session behavior, deletion workflow, frontend integration, and deployment configuration must be revised to the Clerk contract before implementation.
- Stripe remains the source of payment state and Spring Boot remains the source of product Entitlements.
