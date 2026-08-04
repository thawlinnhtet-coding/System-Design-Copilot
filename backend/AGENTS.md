# Backend Agent Guide

This file applies to `backend/`. Also follow the repository root `AGENTS.md`.

## Stack

- Java 25 and Maven Wrapper
- Spring Boot, Spring MVC, Spring Security, OAuth2/OIDC, and JWT
- Spring Data JPA with PostgreSQL and Flyway
- Spring Data Redis
- Spring AMQP and RabbitMQ
- Spring AI with OpenRouter's OpenAI-compatible endpoint
- Lombok for limited boilerplate and MapStruct for boundary mappings

## Structure

- Organize production code by business feature, not by global technical layer.
- Within a feature, separate API adapters, application behavior, domain concepts, and infrastructure when the distinction adds clarity.
- Keep controllers thin: validate transport input, invoke one application use case, and map the result.
- Put transaction boundaries on application services.
- Keep persistence entities and repositories private to their owning feature.
- Expose feature behavior through application interfaces, not cross-feature repository access.
- Do not return JPA entities from APIs or messaging boundaries.

## API Rules

- Place public endpoints under `/api/v1`.
- Use request and response DTOs with Bean Validation.
- Use MapStruct for non-trivial DTO mappings; write explicit code where generated mapping would hide domain decisions.
- Return RFC 9457 `ProblemDetail` errors with stable machine-readable error codes.
- Publish OpenAPI and keep examples free of secrets and private user data.
- Support idempotency keys on externally retried commands where duplicate effects are costly.
- Use optimistic concurrency for Architecture Document updates.

## Data Rules

- Change schema only through forward Flyway migrations.
- PostgreSQL is authoritative for identity, billing projections, entitlements, usage, Workspaces, Reviews, and job status.
- Store the Architecture Document as validated, schema-versioned JSONB while keeping searchable business records relational.
- Create immutable Architecture Revisions for Reviews.
- Never depend on Redis for durable correctness.
- Avoid Lombok `@Data` on JPA entities. Define entity equality deliberately and do not include mutable relationships.

## Security

- Enforce resource ownership and Plan entitlements in application use cases.
- Validate short-lived Clerk API JWT bearer tokens for issuer, audience, authorized party, expiry, signature, and immutable subject.
- Enforce Clerk-managed session revocation through bounded API-token expiry; do not create application-managed cookies, refresh tokens, or CSRF flows.
- Rate-limit login, password reset, AI, import, and billing-sensitive endpoints.
- Associate product Users only from a validated immutable Clerk subject. Clerk owns Google and GitHub identity verification and account linking.
- Verify Stripe and other webhook signatures before parsing business data.
- Never log credentials, cookies, tokens, reset links, full prompts, or full private Architecture Documents.

## Messaging

- Publish durable business messages through a transactional outbox.
- Put identifiers and versions in messages; do not put an entire private Workspace into RabbitMQ.
- Make every consumer idempotent and safe under duplicate delivery.
- Set bounded retries, exponential backoff where useful, and dead-letter routing.
- Propagate correlation, causation, User, Workspace, and job identifiers where appropriate.
- Persist job status before acknowledging a completed message.

## AI

- Access OpenRouter only through an application-owned AI port implemented with Spring AI.
- Keep model identifiers, token limits, and provider base URLs in validated configuration.
- Version prompts and persist the prompt version and model metadata with AI results.
- Build bounded context from the requested Workspace and verify ownership first.
- Require current AI Processing Consent before sending private Workspace context.
- Restrict OpenRouter routing to providers that do not collect user data and disable provider fallback.
- Require structured output for Reviews and validate it before persistence.
- Ground Findings in stable Requirement, Component, Connection, Decision, or Scenario identifiers.
- Do not automatically use a more expensive fallback model without an explicit budget policy.
- Treat malformed output, refusal, timeout, quota, and provider outage as expected failure modes.

## Testing

- Use JUnit 5 for unit and integration tests.
- Use Spring Boot test slices where they give a meaningful boundary.
- Use Testcontainers for PostgreSQL, Redis, and RabbitMQ integration tests.
- Use fake HTTP servers for OpenRouter, Stripe, Clerk JWT-key and identity-lifecycle behavior, and Resend behavior.
- Test authorization and ownership separately from happy paths.
- Test duplicate message delivery, webhook replay, transaction rollback, retry exhaustion, and schema migrations.
- Keep `./mvnw verify` as the complete backend gate.

## Commands

```text
./mvnw spring-boot:run
./mvnw test
./mvnw verify
```

On Windows PowerShell use `./mvnw.cmd`.
