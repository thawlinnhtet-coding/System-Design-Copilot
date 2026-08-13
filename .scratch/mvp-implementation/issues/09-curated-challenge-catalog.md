# 09 - Curated Challenge Catalog

**What to build:** Visitors and Users can discover product-maintained Curated Challenges, inspect entitled prompt details, and start independent private Challenge Workspaces from immutable Challenge Versions.

**Blocked by:** 03 - Free Plan And Usage Policy; 05 - Custom Workspace Lifecycle; 07 - Architecture Document Contract; 19 - Workspace Types And Sources.

**Status:** ready-for-agent

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [ ] The product seeds URL shortener, news feed, and ticket-booking Challenges without a Challenge-authoring UI.
- [ ] Challenge visibility is enforced by backend Entitlements.
- [ ] Public catalog metadata includes title, topic, difficulty, and estimated practice time without exposing protected premium prompt content.
- [ ] Entitled Challenge detail includes the problem statement, initial constraints, skill tags, and high-level Scenario preview without a reference architecture.
- [ ] Topic Packs are the canonical content structure, ordered as request paths, data/read scaling, consistency/contention, async/eventing, reliability/operations, and global/multi-region systems.
- [ ] The first Foundation anchors are URL Shortener, News Feed, Ticket Booking, Notification Delivery, Distributed Job Processing, and Global Rate Limiter; Intermediate and Advanced variants remain deferred until pilot evidence supports them.
- [ ] Difficulty uses reasoning load: Foundation has one dominant path and explicit trade-off; Intermediate combines multiple flows, quantified scale, and competing trade-offs; Advanced combines interacting constraints and ambiguity.
- [ ] Skill Coverage tracks nine granular skills with `introduce`, `practice`, and `demonstrate` levels, one primary skill, and up to three secondary skills mapped to broader Review dimensions.
- [ ] Estimated practice time means the first defensible design and uses Foundation 20-30, Intermediate 45-60, and Advanced 75-120 minute bands.
- [ ] Challenge quality uses seven 1-5 dimensions, requires no critical score below 3 and an average of at least 4, and requires independent review.
- [ ] Content follows Draft, Review, Published, and Retired lifecycle states through version-controlled authoring and authorized content-operator release.
- [ ] Challenge content is published as immutable Challenge Versions.
- [ ] Retiring a Challenge Version prevents new starts and normal discovery while preserving existing snapped Workspaces, Revisions, and Reviews.
- [ ] Starting a Challenge snapshots the selected Challenge Version into a private Challenge Workspace and never changes the source Challenge.
- [ ] Existing attempts offer Continue or Start a new Workspace without merge or overwrite.
