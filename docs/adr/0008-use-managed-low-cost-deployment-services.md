---
status: accepted
date: 2026-08-02
---

# Use Managed Low-Cost Deployment Services

Deploy Next.js to Vercel and Spring Boot to Northflank, with Neon PostgreSQL, Upstash Redis, CloudAMQP RabbitMQ, OpenRouter AI, Stripe billing, Resend email, and encrypted independent PostgreSQL backups in Cloudflare R2. This topology prioritizes low initial cost and reduced operational burden while preserving standard protocols and application-owned data contracts.

## Considered Options

- Operate all components on one virtual machine.
- Adopt one major cloud provider and its native managed services.
- Use specialized low-cost managed providers connected through standard protocols.

A single host is inexpensive but creates one failure and maintenance domain and makes deployment and backup responsibilities immediate. A major-cloud stack offers deeper integration but has more setup and a less predictable low-usage bill. Specialized managed providers reduce initial operations and match the requested budget, at the cost of several vendor control planes and free-tier limits.

## Consequences

- The MVP offers best-effort availability and no paid SLA.
- Cold starts, connection limits, sleeping compute, message quotas, and cross-provider latency must be measured.
- All production connections use TLS, bounded pools, and managed secrets.
- A dedicated scheduled job sends encrypted logical backups through a create-only gateway to an R2 account outside Neon. Versioned private decryption keys are escrowed outside runtime platforms, and restore drills validate key recovery, deletion-tombstone replay, and internal recovery targets.
- Sibling custom domains are required for the preferred authentication-cookie design.
- Provider pricing, region availability, data terms, and plan limits must be revalidated before launch.
- Standard PostgreSQL, Redis, AMQP, OpenAI-compatible HTTP, and container boundaries reduce but do not eliminate migration cost.
