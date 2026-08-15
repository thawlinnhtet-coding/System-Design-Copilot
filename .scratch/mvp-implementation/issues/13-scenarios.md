# 13 - Scenarios

**What to build:** A User can respond to Curated or validated AI-assisted Scenarios and connect the response to design reasoning.

**Blocked by:** 06 - Workspace Reasoning; 07 - Architecture Document Contract; 09 - Curated Challenge Catalog; 11 - AI Consent And Provider Boundary.

**Status:** complete

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] Curated Scenarios and written responses are private Workspace content.
- [x] AI-assisted Scenarios require consent and schema validation before display.
- [x] Completed Scenario context is available to a later Architecture Revision.
- [x] Curated Challenge Scenarios can be introduced as progressive, inspectable, non-blocking pressure tests.
- [x] Every curated Challenge provides a three-stage Scenario arc: growth/scale, failure/reliability, and one topic-specific pressure test.
- [x] URL Shortener includes viral traffic, persistence failure, and malicious/high-volume link abuse Scenarios.
- [x] News Feed includes celebrity fan-out/read surge, feed-worker lag/failure, and freshness/privacy-change Scenarios.
- [x] Ticket Booking includes flash-sale concurrency, reservation/payment failure without overselling, and hold-expiry/cancellation/refund reconciliation Scenarios.

## Comments

- Implemented private Workspace Scenario persistence, progressive curated arcs, consented schema-validated AI-assisted Scenarios, and immutable revision context. Added component and authenticated Playwright journeys.
