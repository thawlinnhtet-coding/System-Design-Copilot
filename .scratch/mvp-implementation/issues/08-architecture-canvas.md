# 08 - Architecture Canvas

**What to build:** A User can create and edit Components and Connections in an accessible Architecture canvas with reliable autosave feedback.

**Blocked by:** 06 - Workspace Reasoning; 07 - Architecture Document Contract.

**Status:** in progress

**Implementation note:** The first vertical slice is now live in the Workspace Design stage: React Flow canvas, typed component palette and inspector, directed connections, Zustand local draft state, debounced optimistic saves, explicit conflict recovery, revision checkpointing, archive read-only mode, and session undo/redo. Full boundary editing, structured connection forms, offline recovery, and the remaining rich property fields are still follow-up slices.

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] A User can edit supported Components, directed Connections, layout, grouping, and properties.
- [ ] Phase 1 includes the agreed vendor-neutral Component Types and Boundaries, with a Custom Component fallback.
- [ ] Components use stable semantic types, semantic icons, bounded typed properties, labels, and optional provider metadata.
- [ ] Compute properties cover responsibility, runtime, state model, scaling signal, concurrency notes, and capacity notes.
- [ ] Data Store properties cover data model, access patterns, partitioning, consistency, replication, retention, and recovery notes.
- [ ] Messaging properties cover delivery semantics, ordering, retry/dead-letter policy, retention, consumer behavior, and replay notes.
- [ ] Edge/Security properties cover routing, protocol/TLS, caching, rate-limit intent, authentication boundary, trust scope, and exposure notes.
- [ ] Identity/Secrets and Observability properties cover authentication/authorization or credential handling, trust/lifecycle, signals, SLO/alerting, retention, and redaction notes.
- [ ] Custom Components use a required label, category, and semantic icon with optional provider and extensible metadata.
- [ ] Connections use stable typed intents with protocol, data intent, communication style, and guarantees.
- [ ] v1 supports request/response, DNS resolution, data read/write, event publish/consume, queue delivery, stream, replication, authentication, and file/object transfer Intents.
- [ ] Connections are directed with distinct source/target Components; parallel flows are allowed, exact redundant duplicates may warn, and self-loops are rejected in v1.
- [ ] Protocol, communication style, data intent, and guarantees use typed enums with bounded explanatory notes and extensible metadata.
- [ ] Boundaries are nested labeled containers with one visual parent per document layer.
- [ ] Components can be added by palette, click-to-place, optional drag-and-drop, or keyboard search.
- [ ] The Canvas does not simulate packets or runtime network behavior.
- [ ] The canvas communicates unsaved, saving, saved, conflict, validation, and offline states.
- [ ] Essential canvas actions have keyboard-accessible alternatives.
- [ ] Palette click-to-place and keyboard insertion are complete paths; drag-and-drop is supported as a convenience and is never required.
- [ ] Component properties edit through one contextual selection panel with inline label editing and typed validation.
- [ ] Connections support drag-to-connect plus structured source/Intent/target creation without dragging.
- [ ] Boundaries are semantically distinct from visual groups, and explicit parent control is available alongside visual movement.
- [ ] Undo/Redo covers the current editing session only, not durable event history.
- [ ] Mobile supports essential inspection and edits through taps, forms, and sheets without precise drag-only interaction.
