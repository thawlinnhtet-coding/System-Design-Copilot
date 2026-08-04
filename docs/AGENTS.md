# Documentation Agent Guide

This file applies to `docs/` and `CONTEXT.md`. Also follow the repository root `AGENTS.md`.

## Sources Of Truth

- `CONTEXT.md`: canonical domain terminology and invariants only.
- `product/PRD.md`: product scope, behavior, requirements, plans, and success criteria.
- `architecture/ARCHITECTURE.md`: current system structure and operational design.
- `architecture/IMPLEMENTATION_PLAN.md`: ordered delivery slices and their exit criteria.
- `adr/`: consequential technical decisions and their trade-offs.

Do not duplicate the same decision across documents. Link to its source of truth.

## Writing Rules

- Use precise terms from `CONTEXT.md` and challenge ambiguous new terminology.
- Keep requirement identifiers stable once code, tests, or issues reference them.
- State MVP, later, and out-of-scope behavior explicitly.
- Describe observable behavior and acceptance criteria rather than vague intent.
- Use diagrams and examples only when they reduce ambiguity.
- Never include real credentials, tokens, private architecture content, or personal data.
- Keep dates in ISO `YYYY-MM-DD` format.

## ADR Rules

- Create an ADR only when a decision is difficult to reverse, surprising without context, and based on a real trade-off.
- Use status `proposed`, `accepted`, `deprecated`, or `superseded by ADR-NNNN`.
- Include alternatives, consequences, validation, or revisit triggers when they add information future readers need.
- Do not edit an accepted ADR to conceal a changed decision. Add a superseding ADR instead.
- Avoid recording routine library usage or implementation detail as an ADR.
