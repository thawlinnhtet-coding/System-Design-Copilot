# 08 - Architecture Canvas

**What to build:** A User can create and edit Components and Connections in an accessible Architecture canvas with reliable autosave feedback.

**Blocked by:** 06 - Workspace Reasoning; 07 - Architecture Document Contract.

**Status:** completed

**Implementation note:** The Workspace Design stage now provides the complete Ticket 08 editing contract: React Flow canvas, typed and custom component palette, category-aware property inspector, directed drag and structured connections, nested boundary editing with explicit parent and membership controls, Zustand local draft state, debounced optimistic saves, explicit validation/conflict/offline recovery, revision checkpointing, archive read-only mode, keyboard deletion, and session undo/redo. Backend validation accepts the Custom Component and nested boundary contract, with focused API coverage.

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] A User can edit supported Components, directed Connections, layout, grouping, and properties.
- [x] Phase 1 includes the agreed vendor-neutral Component Types and Boundaries, with a Custom Component fallback.
- [x] Components use stable semantic types, semantic icons, bounded typed properties, labels, and optional provider metadata.
- [x] Compute properties cover responsibility, runtime, state model, scaling signal, concurrency notes, and capacity notes.
- [x] Data Store properties cover data model, access patterns, partitioning, consistency, replication, retention, and recovery notes.
- [x] Messaging properties cover delivery semantics, ordering, retry/dead-letter policy, retention, consumer behavior, and replay notes.
- [x] Edge/Security properties cover routing, protocol/TLS, caching, rate-limit intent, authentication boundary, trust scope, and exposure notes.
- [x] Identity/Secrets and Observability properties cover authentication/authorization or credential handling, trust/lifecycle, signals, SLO/alerting, retention, and redaction notes.
- [x] Custom Components use a required label, category, and semantic icon with optional provider and extensible metadata.
- [x] Connections use stable typed intents with protocol, data intent, communication style, and guarantees.
- [x] v1 supports request/response, DNS resolution, data read/write, event publish/consume, queue delivery, stream, replication, authentication, and file/object transfer Intents.
- [x] Connections are directed with distinct source/target Components; parallel flows are allowed, exact redundant duplicates warn, and self-loops are rejected in v1.
- [x] Protocol, communication style, data intent, and guarantees use typed enums with bounded explanatory notes and extensible metadata.
- [x] Boundaries are nested labeled containers with one visual parent per document layer.
- [x] Components can be added by palette, click-to-place, optional drag-and-drop, or keyboard search.
- [x] The Canvas does not simulate packets or runtime network behavior.
- [x] The canvas communicates unsaved, saving, saved, conflict, validation, and offline states.
- [x] Essential canvas actions have keyboard-accessible alternatives.
- [x] Palette click-to-place and keyboard insertion are complete paths; drag-and-drop is supported as a convenience and is never required.
- [x] Component properties edit through one contextual selection panel with inline label editing and typed validation.
- [x] Connections support drag-to-connect plus structured source/Intent/target creation without dragging.
- [x] Boundaries are semantically distinct from visual groups, and explicit parent control is available alongside visual movement.
- [x] Undo/Redo covers the current editing session only, not durable event history.
- [x] Mobile supports essential inspection and edits through taps, forms, and sheets without precise drag-only interaction.
