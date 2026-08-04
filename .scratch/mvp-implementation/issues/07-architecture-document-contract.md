# 07 - Architecture Document Contract

**What to build:** A Workspace has a validated, schema-versioned Architecture Document with optimistic saves and immutable Architecture Revisions.

**Blocked by:** 05 - Custom Workspace Lifecycle.

**Status:** ready-for-agent

- [ ] The backend validates document structure, limits, identifiers, and schema versions.
- [ ] Stale saves return an explicit conflict without overwriting newer content.
- [ ] Review preparation can create an immutable Architecture Revision without mutating the working document.
