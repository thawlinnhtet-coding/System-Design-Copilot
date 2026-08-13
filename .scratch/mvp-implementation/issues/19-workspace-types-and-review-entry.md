# 19 - Workspace Types And Sources

**What to build:** Persist fixed Workspace Types and separate Workspace Sources as the shared Workspace creation contract.

**Blocked by:** 05 - Custom Workspace Lifecycle.

**Status:** ready-for-agent

- [ ] A Workspace has one fixed Type: Challenge, Custom Design, or Architecture Review.
- [ ] A Workspace has one Source: Curated Challenge, Custom design, Import Package, or Manual Recreation.
- [ ] Type cannot be changed after creation, and Source remains visible as provenance metadata.
- [ ] Ownership, Entitlement, and validation rules apply equally to every Workspace Type; Review authorization remains owned by Review processing boundaries.
- [ ] Workspace create, list, and resume contracts expose Type and Source.
- [ ] A Challenge Workspace can be resumed or a new independent attempt can be started without merge or overwrite.
