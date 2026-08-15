# 09 - Curated Challenge Catalog

**What to build:** Visitors and Users can discover product-maintained Curated Challenges, inspect entitled prompt details, and start independent private Challenge Workspaces from immutable Challenge Versions.

**Blocked by:** 03 - Free Plan And Usage Policy; 05 - Custom Workspace Lifecycle; 07 - Architecture Document Contract; 19 - Workspace Types And Sources.

**Status:** in-review

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] The product seeds URL shortener, news feed, ticket-booking, notification delivery, distributed job processing, and global rate limiter Challenges without a Challenge-authoring UI.
- [x] Challenge visibility is enforced by backend Entitlements.
- [x] Public catalog metadata includes title, topic, difficulty, and estimated practice time without exposing protected premium prompt content.
- [x] Entitled Challenge detail includes the problem statement, initial constraints, skill tags, and high-level Scenario preview without a reference architecture.
- [x] Topic Packs are the canonical content structure, ordered as request paths, data/read scaling, consistency/contention, async/eventing, reliability/operations, and global/multi-region systems.
- [x] The first Foundation anchors are URL Shortener, News Feed, Ticket Booking, Notification Delivery, Distributed Job Processing, and Global Rate Limiter; Intermediate and Advanced variants remain deferred until pilot evidence supports them.
- [x] Difficulty uses reasoning load: Foundation has one dominant path and explicit trade-off; Intermediate combines multiple flows, quantified scale, and competing trade-offs; Advanced combines interacting constraints and ambiguity.
- [x] Skill Coverage tracks nine granular skills with `introduce`, `practice`, and `demonstrate` levels, one primary skill, and up to three secondary skills mapped to broader Review dimensions.
- [x] Estimated practice time means the first defensible design and uses Foundation 20-30, Intermediate 45-60, and Advanced 75-120 minute bands.
- [x] Challenge quality uses seven 1-5 dimensions, requires no critical score below 3 and an average of at least 4, and requires independent review.
- [ ] Content follows Draft, Review, Published, and Retired lifecycle states through version-controlled authoring and authorized content-operator release.
- [x] Challenge content is published as immutable Challenge Versions.
- [x] Retiring a Challenge Version prevents new starts and normal discovery while preserving existing snapped Workspaces, Revisions, and Reviews.
- [x] Starting a Challenge snapshots the selected Challenge Version into a private Challenge Workspace and never changes the source Challenge.
- [x] Existing attempts offer Continue or Start a new Workspace without merge or overwrite.

## Comments

- 2026-08-14: Review fixes completed on `ticket-09-curated-challenge-catalog`: seeded all six Foundation anchors, routed Challenge access through the entitlement boundary, added filterable compact catalog/detail attempt UX, shared API-test adapter coverage, immutable full-version snapshots, and blocked direct challenge workspace creation without a snapshot. Exact nine-skill taxonomy validation, seven-dimension quality scoring with independent review, and authorized Draft/Review/Published/Retired content operations remain follow-ups for the content-operations phase.
- 2026-08-15: Added persistent independent-review and seven-dimension quality data for every published Challenge Version. The backend validates the exact nine-skill taxonomy, coverage levels and primary/secondary limits, score thresholds, and reviewer before serving or starting a Challenge. The authorized content-operator lifecycle remains the final follow-up.
