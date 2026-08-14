# 19 - Workspace Types And Sources

**What to build:** Persist fixed Workspace Types and separate Workspace Sources as the shared Workspace creation contract.

**Blocked by:** 05 - Custom Workspace Lifecycle.

**Status:** complete

- [x] A Workspace has one fixed Type: Challenge, Custom Design, or Architecture Review.
- [x] A Workspace has one Source: Curated Challenge, Custom design, Import Package, or Manual Recreation.
- [x] Type cannot be changed after creation, and Source remains visible as provenance metadata.
- [x] Ownership, Entitlement, and validation rules apply equally to every Workspace Type; Review authorization remains owned by Review processing boundaries.
- [x] Workspace create, list, and resume contracts expose Type and Source.
- [x] A Challenge Workspace can be resumed or a new independent attempt can be started without merge or overwrite.

## Comments

2026-08-14 — Implemented and verified in `ticket-19-workspace-types-and-sources`. Workspace type/source enums are persisted as immutable creation metadata, validated in the API contract, preserved through ownership and entitlement checks, and exposed by create/list/resume responses. The challenge catalog supports resuming the latest attempt or starting an independent workspace. Backend `mvn verify`, frontend typecheck, scoped lint, 47 unit tests, and production build passed. The branch uses migration `V11__add_workspace_types_and_sources.sql`; ticket #11 owns `V10`.
