# 07 - Architecture Document Contract

**What to build:** A Workspace has a validated, schema-versioned Architecture Document with optimistic saves and immutable Architecture Revisions.

**Blocked by:** 05 - Custom Workspace Lifecycle.

**Status:** ready-for-agent

- [ ] The backend validates document structure, limits, identifiers, and schema versions.
- [ ] Component properties use a minimal common core with typed category extensions, typed enums, bounded notes, and bounded extensible metadata.
- [ ] The document contract supports reasoning fields for Compute, Data Store, Messaging, Edge/Security, Identity/Secrets, and Observability Components without credentials, provider runtime configuration, or runtime simulation.
- [ ] Component and Connection schema validation uses typed enums, bounded notes, stable identifiers, and bounded extensible metadata.
- [ ] Stale saves return an explicit conflict without overwriting newer content.
- [ ] Conflict handling preserves the local draft and requires an explicit User resolution.
- [ ] Review preparation can create an immutable Architecture Revision without mutating the working document.
