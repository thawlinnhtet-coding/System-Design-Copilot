---
status: accepted
date: 2026-08-02
---

# Use A Package-By-Feature Modular Monolith

Implement the backend as one Spring Boot deployable organized into explicit business-feature modules. The HTTP API, outbox publisher, and RabbitMQ consumers initially run in one application process because the product needs transactional consistency and low operating cost more than independent service scaling.

## Considered Options

- Independently deployed microservices for identity, billing, workspace, and AI work.
- One application organized by global controller, service, and repository layers.
- One deployable modular monolith organized by feature.

Microservices create additional deployments, network failure modes, distributed transactions, and observability work before load or team boundaries justify them. A globally layered monolith is simple initially but allows feature ownership to erode. Feature modules preserve extraction boundaries without paying the operational cost now.

## Consequences

- Features communicate through application interfaces and cannot access another feature's repositories directly.
- Architecture tests should protect module boundaries.
- One deployment can scale only as a unit initially.
- The same image may later support API-only and worker-only runtime modes when Review workload requires isolation.
- Extraction to a service requires observed scaling, reliability, security, or team-ownership evidence and a new ADR.
