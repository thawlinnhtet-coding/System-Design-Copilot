# UX Redesign: Engineering Practice Workshop

Status: complete

## Purpose

Redesign the System Design Copilot experience so it feels like an authored practice workspace rather than a generic AI SaaS dashboard or diagramming tool.

This is a UX and product-expression effort. It preserves the approved domain model, backend boundaries, AI advisory behavior, immutable Architecture Revisions, and existing MVP delivery tickets unless an implementation ticket is explicitly updated later.

## Product Outcome

Within the first 10 minutes, a User should make one defensible architectural decision: clarify a need, compare options, and record a justified choice.

## Shared Understanding

### Information hierarchy

- Practice Home helps a User resume the most relevant unfinished Workspace or begin deliberate practice.
- Workspace Type is visible in creation and Workspace context: Challenge, Custom Design, or Architecture Review. Workspace Source remains separate provenance metadata.
- Persistent product navigation contains Practice, Challenges, and Progress. Account, Plan & Billing, settings, and data utilities remain secondary.
- An active Workspace uses a flexible stage rail labeled Clarify, Design, Stress-test, and Review. These are user-facing interface labels, not new domain concepts or required sequential states.
- The active Workspace keeps the current goal and next action visible.
- A new custom Workspace is a guided blank start: it preserves a blank Architecture Document while presenting a problem brief, compact reasoning list, and a suggested next action.
- Custom Design Workspace creation asks only for a Workspace name and System Idea. It opens on Clarify with a fixed prompt, an optional first Requirement, and blank Architecture Document context.
- Custom Design Workspace stages remain visible and flexible; Review readiness warns about missing evidence without enforcing a minimum component or reasoning count.

### Workspace behavior

- Clarify is a focused problem brief plus compact reasoning list for Requirements, Assumptions, estimates, and unresolved Questions; it is not a form-heavy dashboard.
- Design is Canvas-first: the Architecture Canvas is nearly full-screen, with compact palette/command search and one contextual inspector or panel at a time.
- Stress-test is a focused Scenario adaptation workspace that preserves the changed condition while the User adapts the Architecture Document and links evidence.
- Review is an evidence briefing with interpretation, strengths, risks, uncertainty, prioritized actions, and direct return paths to Design.
- The Copilot is a contextual coach. It leads with one sharp question and offers depth on demand.
- Copilot has one persistent recognizable entry point but opens as an on-demand contextual drawer or sheet, never a permanent chat column.
- AI content uses a subtle Copilot provenance label and must not use robot avatars, glowing gradients, or magic effects.

### Canvas and evidence

- Components use a small mapped set of Lucide semantic icons with visible labels. Color is a secondary cue.
- The Component palette is organized by the agreed vendor-neutral taxonomy and exposes the Phase 1 set without vendor lock-in.
- Components can be created from a labeled palette, searchable command menu, or direct manipulation. No essential action is drag-only.
- Connections show direction and support a short communication or data intent label. Important rationale or evidence can be attached through the existing reasoning model.
- Review Findings can jump to cited Requirements, Assumptions, Decisions, Components, Connections, or Scenario responses and return to the Review.
- Review comparison is a change briefing showing resolved, introduced, and still-uncertain evidence, not a causal score-improvement claim.
- Review history lives inside the Workspace Review stage; global Progress aggregates across Workspaces without duplicating Workspace history.

### Practice loop

- Scenarios enter as pressure-test mode: conditions change, the User explains or adapts one decision, and the response remains attached to the Workspace.
- A Review feels like an evidence briefing with strengths, risks, uncertainty, and prioritized next actions.
- Progress represents qualified evidence from completed Decisions, Scenarios, Review changes, and open questions. Do not lead with streaks, badges, arbitrary points, or unsupported improvement claims.
- Challenge catalog supports public-safe metadata, featured starter content, filters for difficulty/topic/time, locked premium previews, prompt-only detail, and clear Start or Continue actions.

### Landing page flow

- Above the fold prioritizes comprehension before conversion: `Design systems. Explain your decisions. Improve with evidence.`, `Explore Challenges` as the primary CTA, and `See how practice works` as the secondary action.
- The hero uses concise copy and leads into one large four-state realistic product demonstration rather than generic illustration or a dashboard screenshot.
- The page narrative is Hero and promise -> four-state demonstration -> clarify/decide/improve outcomes -> representative Challenges -> Public Free beta -> Explore Challenges.
- The Evidence section connects a Requirement, Design Decision, Architecture element, Scenario pressure, and evidence-grounded Finding; scores are not the primary proof.
- The Challenges section previews URL Shortener, News Feed, and Ticket Booking with Topic Pack context, difficulty, estimated time, and skill focus, then links to the public catalog.
- The Build judgment section uses three concise contrasts: practice before answers, evidence before scores, and user authorship before automatic generation.
- Trust & Public Beta states implemented privacy/consent behavior, public Free/test-mode status, best-effort operation, and current recovery limitations with links to detailed policies.
- Signed-out navigation contains Brand, How it works, Challenges, Sign in, and Explore Challenges. Account, Progress, Workspaces, and pricing are not primary signed-out destinations.
- Visitors browse Challenge metadata and detail before authentication. `Start practice` on Challenge Detail sends a visitor to the dedicated Clerk route while preserving the intended destination.

### Responsive and accessible behavior

- Desktop is the primary surface for complex Canvas editing.
- Mobile fully supports Landing, Catalog, Challenge Detail, authentication, Practice Home, Clarify, Scenario response, Review reading, and account flows, plus essential Canvas inspection and editing.
- Mobile Workspace uses a focus stack and sheets rather than compressed desktop columns.
- Mobile landing preserves the desktop narrative in sequence with reduced copy, large touch targets, minimal navigation, vertical evidence artifacts, and editorial Challenge rows instead of dense grids or carousels.
- Core interactions are keyboard-first: visible labels or accessible names, logical focus order, visible focus, essential shortcuts, reduced-motion support, and no pointer-only operation.
- The visual Canvas has a synchronized semantic outline and property editor so important architecture information is not spatial-only.
- Save status is a quiet persistent header state. Conflicts and offline conditions escalate to clear, actionable messages.

## Visual System

- Direction: structured modern engineering practice workshop.
- Theme: graphite chrome, warm bone documents, and a deep spatial Architecture Canvas with no global theme toggle in MVP.
- Typography: Space Grotesk for display and headings, IBM Plex Sans for UI and body copy, and IBM Plex Mono only for intrinsically technical values and machine state.
- Signal color: petrol teal for interaction and focus, with amber reserved for Scenario meaning. Do not use generic indigo or purple AI palettes, gradients, glow, or decorative color fields.
- Surfaces: quiet engineering-workshop geometry with 3-5px corners, 1px hairline rules, restrained elevation, and no card proliferation.
- Assets: authored diagrams, annotated interface fragments, and real product artifacts. Avoid generic AI hero art, stock photography, robot mascots, and abstract gradient blobs.
- Icons: Lucide at a consistent 1.5px outline for controls plus vendor-neutral geometric symbols for Architecture Component Types, with visible labels and accessible names.
- Motion: purposeful 160-220ms transitions for focus changes, panel transitions, save states, Scenario pressure changes, and Review processing. Respect reduced-motion preferences and avoid decorative looping motion.

## Brand Direction

- Product name remains "System Design Copilot".
- Use a full mark plus wordmark publicly, a compact mark plus short wordmark in the app shell, and the mark alone as favicon.
- Working logo concept: a compact structural mark based on connected nodes or the four-stage loop, with one petrol-teal active connection and amber reserved for Scenario meaning. Use a one-line Space Grotesk wordmark and no robot, brain, spark, cloud, gradient, or literal network-logo cliché.
- The first logo exploration should test the mark at favicon, 16px icon, navigation, landing hero, and monochrome sizes.

## Implementation Bridge

Use repository-root `DESIGN.md` as the tokenized design contract with the existing Tailwind CSS, shadcn/ui, and Lucide foundations. Define reusable primitives for typography, buttons, fields, focus panels, stage rail, evidence links, statuses, and icons rather than producing isolated screen-specific styling.

## First Design Slice

Start with the Clarify and Design Workspace stages. They validate the stage rail, problem brief, reasoning list, Canvas-first surface, contextual tools, Copilot entry, save state, accessibility, and responsive behavior. Use the resulting primitives for Practice Home, Challenges, Stress-test, Review, and Account surfaces.

## Reference Research

The comparative primary-source teardown is recorded at `docs/research/ux-reference-teardown.md`. It is a benchmark of patterns, not a visual or product template to copy.

## Domain Decision

No new durable domain term was introduced. `Workspace`, `Architecture Document`, `Decision`, `Scenario`, `Review`, and `Finding` remain defined by `CONTEXT.md`. `Clarify`, `Design`, `Stress-test`, and `Review` are interface stages only.
