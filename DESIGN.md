# System Design Copilot — DESIGN.md

> **Design governance.** The approved Pencil artifact at [`ui_design`](./ui_design) is the repository's canonical visual and interaction design source of truth. This document records the durable rules, behavior notes, and implementation guidance derived from that artifact. If this document conflicts with `ui_design`, follow `ui_design`, then update this document in the same change. Do not implement from screenshots or allow the artifact and this document to drift.

## 1. Design Vision

System Design Copilot is a modern engineering practice environment for learning, designing, challenging, and reviewing software architectures.

The interface should feel like a **professional engineering workspace with editorial clarity**.

The product is:

* document-first
* architecture-aware
* technically precise
* calm
* modern
* focused
* educational without feeling academic
* AI-assisted without feeling AI-dominated

The product should **not** look like a generic SaaS dashboard, admin panel, chatbot, online course, or diagramming tool.

### Design character

**Structured Modern × Engineering Practice Workshop**

Think:

> A calm professional practice workshop where engineers design systems, explain decisions, and improve with evidence.

Documents communicate reasoning.

The canvas communicates structure.

The Copilot assists both.

---

# 2. Core Design Principles

## 2.1 Document First

Most product surfaces are documents rather than dashboards.

Examples:

* Challenge Brief
* Requirements
* Assumptions
* Capacity Estimation
* Decision Log
* Scenarios
* Architecture Review
* Recommendations
* Progress

Prefer:

* sections
* typography
* whitespace
* rules
* tables
* structured fields
* annotations

over collections of floating cards.

Cards should represent genuinely independent objects, not become the default container for every piece of content.

---

## 2.2 Architecture Is Spatial

The Architecture Canvas is the primary exception to the document model.

It is a spatial engineering surface.

The canvas should feel like a technical workspace, not a playful whiteboard.

Architecture components should be:

* flat
* semantic
* compact
* readable
* vendor-neutral by default
* easy to connect
* easy to inspect

Connections, boundaries, labels, and states must remain visually understandable even in large architectures.

---

## 2.3 Reasoning Over Decoration

Visual hierarchy should communicate:

* what the user is working on
* what stage they are in
* what changed
* what needs attention
* what the system believes is important
* what action is available next

Do not add decoration simply to make empty areas feel designed.

Whitespace is intentional.

---

## 2.4 AI Is a Collaborator, Not the Product

The user's architecture and reasoning remain the primary artifact.

Copilot should appear contextually through:

* suggestions
* questions
* review comments
* contextual actions
* side panels
* inline recommendations

Avoid making the entire application look like a chatbot.

Do not place a giant AI input in the center of core workspace screens.

---

# 3. Visual Language

## 3.1 Physical Character

Use a **quiet workshop** visual system.

Default characteristics:

* 1px hairline borders
* mostly square geometry
* 3–5px corner radius
* minimal elevation
* almost no decorative shadows
* no glassmorphism
* no decorative gradients
* restrained use of color
* strong typography
* clear alignment

Surfaces should feel constructed rather than inflated.

---

# 4. Color System

Use semantic tokens rather than hard-coded component colors. Every foreground/background pair used for text, controls, focus, and status must meet WCAG 2.2 AA.

## Foundation Palette

```css
--chrome: #151918;
--canvas: #0D1211;
--paper: #F4F1E8;
--paper-raised: #FBF9F3;
--ink: #18201E;
--ink-muted: #626A66;
--ink-on-dark: #F0F3F1;
--ink-on-dark-muted: #A7B0AC;
--line: #D7D2C7;
--action: #0F766E;
--action-subtle: #DCEFEB;
--scenario: #9A5310;
```

Dark graphite chrome frames the working artifact. Warm bone paper carries documents, forms, and reading surfaces. Deep Canvas is reserved for spatial architecture work.

Avoid pure white, blue-black chrome, and generic indigo AI-product accents.

## Accent Roles

Petrol teal communicates interaction, selection, and focus. It is not decorative branding and should usually appear on one primary action per region.

Amber communicates changed conditions and Scenario context. It must not compete with the primary action or replace warning semantics in unrelated flows.

The foundation pairs are contrast-checked for normal text: ink/paper 14.71:1, muted ink/paper 4.93:1, white/action 5.47:1, action/paper 4.85:1, dark ink/chrome 15.87:1, dark muted ink/chrome 7.98:1, and Scenario/paper 5.14:1. Component states and semantic colors still require pair-specific verification during implementation.

AI does not receive a purple or separate branded color. Copilot uses the same interaction and document tokens as the rest of the product.

## Semantic Colors

Success, warning, danger, and information colors remain distinct from the primary action and Scenario accent. Their final values must be contrast-tested on both paper and graphite surfaces before implementation.

Never turn entire pages into colorful dashboards.

---

# 5. Typography

Typography creates identity without making the product feel like a journal, terminal, or generic SaaS application.

Use three fixed roles:

* **Space Grotesk** for landing display, page titles, and section headings.
* **IBM Plex Sans** for navigation, controls, forms, labels, body text, and ordinary metadata.
* **IBM Plex Mono** only for protocols, units, IDs, paths, technical values, and machine state.

Use sentence case by default. Avoid decorative uppercase labels and excessive letter spacing. Metadata is sans-serif unless its content is intrinsically technical.

Weights should usually remain between 400 and 600. Hierarchy comes from size, spacing, alignment, and surface—not from making every heading bold.

---

# 6. Type Scale

Suggested desktop hierarchy:

```text
Landing       56–68px
Page Title    36–42px
Section       22–28px
Subheading    18–20px
Body          15–16px
Small         13–14px
Metadata      12–13px
Technical     12–14px mono
```

Use comfortable document line lengths.

Long-form text should generally remain around:

```text
65–80 characters
```

Do not stretch document paragraphs across the entire viewport.

---

# 7. Spacing

Use a consistent 4px-based system.

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

Document sections should use more vertical whitespace than application controls.

Dense engineering controls may use tighter spacing.

---

# 8. Borders and Radius

## Borders

Default:

```text
1px solid
```

Use borders to define hierarchy instead of shadows.

Border contrast should remain subtle.

---

## Radius

Default:

```text
Small controls: 3–4px
Inputs: 4–5px
Panels: 4–5px
Large surfaces: 5px maximum
```

Avoid excessive pill shapes.

Pills should primarily represent:

* status
* filters
* tags
* compact metadata

---

# 9. Shadows

Use shadows rarely.

Acceptable:

* temporary floating menu
* command palette
* modal
* drag state
* elevated canvas tool

Avoid shadows on ordinary:

* sections
* cards
* documents
* navigation
* architecture nodes

Hierarchy should primarily come from surface, border, spacing, and typography.

---

# 10. Application Architecture

Public pages and the authenticated application use related but distinct navigation layers.

Public navigation contains the product mark, `How it works`, `Challenges`, `Sign in`, and `Explore Challenges`. Authenticated global navigation contains `Practice`, `Challenges`, `Progress`, and the account menu. Do not use a large persistent global dashboard sidebar.

The account menu opens one compact settings area with Profile and Clerk-managed sessions, Plan and current usage, AI processing and consent, data import/export, and privacy and account deletion. Detailed settings use a light shared header, a narrow settings navigation, and one focused section at a time; do not repeat a large dark state-board header on every section. Account deletion is visually separated and requires recent authentication. Usage also appears contextually when it affects an action.

Practice, Workspaces, Progress, Account, Data, Dashboard, and Billing are authenticated application surfaces. An unauthenticated request to those routes returns to the public landing page; the public landing, Challenges catalog, Pricing, and Clerk authentication routes remain reachable.

Workspace screens introduce their own contextual structure:

```text
┌────────────────────────────────────────────────────────────┐
│ Compact global navigation                                  │
├────────┬──────────────────────────────────────┬─────────────┤
│ Stage  │                                      │ Inspector / │
│ rail   │          Primary artifact            │ Copilot     │
│        │          Document or Canvas          │             │
└────────┴──────────────────────────────────────┴─────────────┘
```

The context drawer for brief, Requirements, Assumptions, and Decisions is collapsible. Inspector and Copilot share one right-side panel rather than becoming simultaneous permanent columns. The artifact always receives priority, and chrome should disappear when it is not useful.

---

# 11. Workspace Model

Every Workspace uses four canonical stages:

```text
Clarify  ↔  Design  ↔  Stress-test  ↔  Review
```

* **Clarify** contains the brief, Requirements, Assumptions, estimates, and unresolved questions.
* **Design** contains the Architecture Canvas, Components, Connections, and Decisions.
* **Stress-test** contains user-started Scenarios, changed conditions, and responses.
* **Review** contains checkpoint confirmation, processing state, interpretation, Findings, next actions, and revision comparison.

Artifacts remain available across relevant stages. The stages guide practice but never form a blocking wizard. Users may move freely, revisit reasoning, and see current evidence, missing context, and one suggested next action.

---

# 12. Stage Rail

Desktop workspaces use a narrow contextual stage rail. It is separate from global navigation.

It communicates:

* current stage
* existing evidence
* available stages
* review state
* scenario state
* one suggested next action

Use:

* text
* subtle indicators
* hairline structure

Avoid large colorful icons for every stage.

---

# 13. Document Surface

Documents are the visual center of the product.

Recommended structure:

```text
Eyebrow / context

Document title
Short description

────────────────────────

Section heading

Body / structured content

Supporting metadata

────────────────────────

Next section
```

Documents should feel writable and inspectable.

Avoid wrapping every section in a card.

---

# 14. Challenge Brief

The Challenge Brief should resemble a concise engineering specification.

Structure:

```text
Challenge identity
Difficulty / topic / expected time

Title

Problem context

Core objective

Initial constraints

Expected reasoning areas

Start practice
```

Do not reveal the solution architecture.

The brief provides context, not answers.

---

# 15. Requirements

Separate:

* functional requirements
* non-functional requirements
* assumptions
* constraints

Requirements should behave like structured document elements.

Each requirement may have:

* statement
* importance
* source
* status
* annotation

Avoid Kanban-style presentation.

---

# 16. Capacity Estimation

Estimation should resemble an engineering worksheet.

Use:

* structured inputs
* formulas
* units
* calculated outputs
* assumptions
* compact tables

Technical values should use monospace.

Example:

```text
Daily active users       2.5M
Requests / user / day       18
──────────────────────────────
Average requests/sec       521
Peak multiplier            ×4
Peak requests/sec        2,084
```

Calculation should feel transparent rather than magical.

---

# 17. Architecture Canvas

The Design stage is a dedicated dark spatial plane. The stage heading, description, and Canvas Toolbar share that plane, matching the approved `ui_design` Workspace Design screens.

Recommended surface:

```css
--canvas: #101316;
--canvas-grid: #20252A;
```

The Design stage article uses `#0D1211` as its artifact background with `#151C1A` chrome for the Canvas Toolbar and legend, and a `#101316` canvas box inside.

The Canvas Toolbar sits between the stage heading and the canvas box. It contains:

* editing tools: `Select`, `Pan`, `Component`, `Connection`, `Boundary`
* view controls: `Undo`, `Redo`, `Fit view`, `Full screen`, and a live zoom percentage

The `Component` tool places a Service at the clicked flow position; `Connection` opens the palette connection form and enables click-to-connect; `Boundary` opens the palette boundary form. `Select` restores node dragging and default interaction. The React Flow zoom controls are not rendered; zoom is available through the view controls, wheel, and pinch.

While the canvas is in full screen, the Design stage heading swaps to `Architecture Canvas` and the description reads `Full-screen editing · Press Esc to return to the Workspace.`, matching the approved `ui_design` full-screen canvas screen. Full screen stays inside the workspace shell: the global navigation, workspace header, stage rail, heading, and context panel remain visible, the Design artifact expands to fill the full body width and height, and the canvas fills the remaining space. The palette becomes a scrollable 180px rail on desktop. `Esc` or the toolbar toggle returns to the embedded canvas.

A legend strip runs along the bottom edge of the canvas box and reports the current interaction hint. A footer below the canvas box always reports component, connection, and boundary counts, the live zoom, the save state, and the Checkpoint Revision action (shown only in full screen before this rule).

When the canvas has no Components, a centered onboarding panel offers a primary Add Component action instead of an empty plane.

Grid treatment should be extremely subtle.

Do not make the canvas visually noisy.

---

# 18. Architecture Nodes

Nodes represent semantic system components.

Examples:

* Client
* CDN
* DNS
* Load Balancer
* API Gateway
* Service
* Worker
* Function
* Relational Database
* NoSQL Database
* Cache
* Object Storage
* Queue
* Event Bus
* Identity Provider
* External API

Node appearance:

```text
┌───────────────────────────┐
│ ▦  API Gateway            │
│     authenticated         │
└───────────────────────────┘
```

Characteristics:

* compact
* flat
* 1px border
* 4–6px radius
* semantic icon in a `#242E2B` icon box
* clear label
* optional small metadata line derived from the component's primary semantic property (for example runtime, consistency, delivery guarantee, or exposure)
* no large illustrations
* no heavy shadow

Selection should use accent border/focus treatment rather than large glow effects.

---

# 19. Architecture Connections

Connections are typed and directed.

Support concepts such as:

* synchronous request
* asynchronous message
* event
* data replication
* read/write path
* streaming

Different connection types may use restrained combinations of:

* line pattern
* arrow
* label
* subtle semantic color

Do not depend on color alone.

---

# 20. Architecture Boundaries

Boundaries represent:

* region
* network
* cluster
* trust boundary
* deployment boundary

Use large low-contrast containers.

Boundaries should sit visually behind components.

Labels should remain readable without competing with nodes.

---

# 21. Architecture Inspector

Selecting a node or connection may open a contextual inspector.

Possible fields:

```text
Type
Name
Responsibility
State model
Consistency
Protocol
Delivery semantics
Authentication
Notes
```

The inspector should be compact and structured.

Do not use modal dialogs for ordinary editing.

---

# 22. Decision Log

Architecture decisions should resemble lightweight ADRs.

Structure:

```text
Decision

Context

Chosen approach

Alternatives

Trade-offs

Consequences
```

Decision entries should prioritize reasoning over status decoration.

---

# 23. Scenario Experience

Scenarios pressure-test an existing design.

Scenario availability is visible but quiet. Users choose when to begin; it never appears as an automatic interruption. Sparse designs receive a warning rather than a block.

Starting reveals one changed condition and makes the Scenario part of subsequent Review context. Users document what changes and why while the original architecture remains recoverable through revisions.

Scenario presentation:

```text
SCENARIO 02

Traffic has increased 20×.

Your queue consumers are falling behind and
delivery latency is increasing.

What changes?

[Inspect architecture]
```

The scenario should feel like an engineering event, not a quiz question.

---

# 24. Architecture Review

Review should look like a professional engineering assessment.

Suggested hierarchy:

```text
Interpretation
Strengths worth preserving
Prioritized risks
Evidence-linked Findings
Uncertainty and missing context
Recommended next actions
Seven supporting dimensions
Review history and comparison
```

Findings may have severity:

```text
Critical
High
Medium
Low
Observation
```

Use severity color carefully.

Do not use a composite score, grade, radar-chart centerpiece, or automatic architecture changes. Review submission confirms an immutable checkpoint, processes asynchronously, and lets the User continue practicing. Completion may notify across contexts without interrupting current work.

---

# 25. Review Finding

Example:

```text
HIGH

Single-region persistence creates
a significant availability risk.

The architecture currently routes...

Evidence
...

Recommendation
...
```

The explanation is more important than the badge.

---

# 26. Progress

Progress is a **learning report**, not a gamified dashboard.

Communicate:

* recent practice activity
* completed Reviews
* Scenario completion
* Challenge and topic coverage
* recurring strengths supported by Review evidence
* recurring risks supported by Review evidence
* dimension changes only across comparable Reviews
* suggested next practice

Charts are acceptable where they genuinely reveal change.

Avoid:

* giant KPI cards
* meaningless percentages
* excessive streak mechanics
* badges or XP
* composite skill scores
* unsupported claims of improvement
* confetti
* gamification unrelated to learning

---

# 27. Practice Home

Practice Home should answer:

> What should I work on next?

Prioritize:

1. Continue the most relevant unfinished Workspace
2. Recommended next Challenge
3. Recent Workspaces
4. Topic progression
5. Start Custom Design or Review an existing architecture
6. Explore all Challenges

A new User with no Workspace sees one recommended starter Challenge, one sentence explaining the practice loop, and secondary paths to Custom Design and Architecture Review. Do not show empty analytics, zero-value metrics, blank archives, or Plan usage.

Plan and usage information appears when it affects an action, not as primary page content.

Do not create a traditional admin dashboard.

---

# 28. Challenge Catalog

Challenges are browsable learning artifacts.

Use a compact editorial list with a filter bar. Allow filtering by:

* topic
* difficulty
* estimated practice time
* skill focus

Rows show title, short premise, difficulty, time, skill focus, availability, and attempt state. Highlight one recommended Challenge through placement and hierarchy rather than a giant card. Locked Challenges reveal safe metadata but never protected problem content.

On mobile, each row recomposes into a compact stacked item.

Challenge Detail presents identity, context, objective, initial constraints, reasoning areas, a non-spoiling Scenario preview, existing attempts, and one primary action: `Start practice` or `Continue practice`.

Challenge previews should remain compact.

Avoid giant marketing cards.

---

# 29. Copilot

Copilot begins as a quiet contextual entry point with an unresolved-question count. It opens only when requested or when a relevant prompt is available.

It can:

* ask clarification questions
* challenge assumptions
* inspect architecture
* surface overlooked concerns
* explain review findings
* suggest areas to investigate

Copilot should not automatically design the entire architecture unless explicitly requested and allowed by the product flow.

The user remains the engineer.

When open on desktop, Copilot shares the right contextual panel with Inspector. It must not create a fourth permanent column. On mobile it opens as a dedicated sheet.

Before the first Copilot or Review AI operation, show a focused consent disclosure with the exact Workspace categories being sent, exclusions, provider privacy routing, future revocation behavior, and the inability to retract context already sent. `Continue without AI` remains a real alternative. Do not repeatedly interrupt after consent unless scope or policy changes.

---

# 30. Copilot Messages

Avoid conventional oversized chat bubbles.

Prefer a cleaner conversational document treatment.

Distinguish:

```text
COPILOT

Have you considered what happens when
the primary region becomes unavailable?

────────────────────────

YOU

I would fail over...
```

Keep conversation visually integrated with the engineering workspace.

---

# 31. Commands and Contextual Actions

Support fast actions through:

* command palette
* contextual menus
* keyboard shortcuts
* selection toolbar
* slash commands where appropriate

Experienced users should be able to work quickly without excessive clicking.

---

# 32. Empty States

Empty states should guide action rather than decorate.

Bad:

> Nothing here yet 🎉

Better:

> No architecture components yet.

> Add a client, service, datastore, or infrastructure component to begin describing the system.

Use one clear primary action.

---

# 33. Loading

Prefer:

* skeletons
* local progress
* subtle status indicators

Avoid large blocking spinners whenever possible.

Long AI operations should communicate what is happening.

Example:

```text
Reviewing architecture…
Examining reliability decisions
```

Use inline feedback for forms, validation, quotas, save state, conflicts, and recoverable failures. Toasts are reserved for cross-context events such as a Review completing while the User works elsewhere. Errors state what happened, whether work is safe, and the next action.

---

# 34. Saving

Autosave should be quiet.

Example states:

```text
Saving…
Saved
Unable to save
```

Do not display success notifications for every autosave.

---

# 35. Motion

Motion explains state.

Default duration:

```text
160–220ms
```

Use motion for:

* panel opening
* stage changes
* selection
* save state
* inspector changes
* scenario reveal
* focus transitions

Avoid:

* parallax
* animated gradients
* bouncing elements
* decorative page transitions

Respect `prefers-reduced-motion`.

---

# 36. Landing Page

The landing page is a product introduction, not an authenticated workspace.

Recommended narrative:

```text
Hero and promise
↓
Four-state realistic product demonstration
↓
Three outcomes: clarify, decide, improve
↓
Real Challenge examples
↓
Public Free beta explanation
↓
Final Explore Challenges action
```

The product itself should provide most of the visual evidence.

Avoid excessive marketing illustration, fake testimonials, invented metrics, generic feature grids, AI hype, and unavailable Pro pricing.

---

# 37. Landing Hero

The hero should quickly communicate:

**Design systems. Explain your decisions. Improve with evidence.**

Supporting copy should explain that users:

* work through realistic challenges
* make architecture decisions
* respond to changing scenarios
* receive engineering reviews
* improve through repeated practice

Primary CTA for visitors:

**Explore Challenges**

Secondary CTA:

**See how practice works**

For an authenticated returning User, the primary CTA becomes **Continue practice**. Use **Start practice** on Challenge Detail, where the destination is concrete.

---

# 38. Product Demonstration

Use one large staged demonstration with four selectable states:

```text
Understand the Challenge
→ Make an architecture decision
→ Respond to a Scenario
→ Inspect evidence-backed feedback
```

Use realistic product UI and representative content. Visitors do not edit a fake Canvas. On mobile, the states stack or switch in place rather than shrinking a desktop screenshot.

---

# 39. Personal Beta and Plans

The public release is a Free personal beta. Show a small `Personal beta` label in public navigation and Practice Home, with clear disclosure during registration and in account settings.

Explain best-effort availability and current recovery limitations in plain language. Do not use a permanent warning banner. Do not promote production Pro purchasing while ordinary beta Users cannot buy paid access.

Plan usage appears contextually when it blocks or limits an action.

---

# 40. Authentication

Authentication uses a dedicated Clerk page and preserves the selected Challenge or intended destination.

Use:

* a predominantly warm document surface
* compact product mark
* destination context such as `Continue to URL Shortener practice`
* Clerk-managed email/password, Google, and GitHub flows
* the product typography, color, control, focus, loading, and error tokens through Clerk appearance configuration
* minimal dark graphite framing
* minimal secondary navigation

Do not show a fake product preview, architecture illustration, or `Continue with Clerk` action. Clerk is authentication infrastructure, not visible product identity.

### Approved authentication states

The branded Clerk route must provide explicit, non-passwordless credential flows on desktop and mobile:

* sign in: email address, password, password visibility control, `Forgot password?`, Google, and GitHub;
* create account: email address, password, contextual strength feedback, Google, and GitHub;
* email verification: six-digit code, resend, and a statement that verification is required before AI operations or billing changes;
* password recovery: reset request, time-limited reset link, and new-password completion; and
* temporary-unavailable retry: preserve the destination, email, and password fields, explain that the interruption is temporary, and offer `Try again` and `Back to sign in`.

Credential errors are inline and specific to their field or recovery step. Never reveal whether an email address is registered. Do not hard-code a password-length rule such as `8+ characters`; Clerk policy is authoritative. Before submission, use neutral guidance about unique, non-reused passwords. During validation, show contextual strength or corrective feedback.

---

# 41. Responsive Strategy

Mobile preserves the document-first principle.

Landing, Catalog, Challenge Detail, authentication, Practice Home, Clarify, Scenario response, Review reading, and account flows must be fully usable on mobile.

Persistent desktop rails become:

* drawers
* sheets
* compact tabs
* contextual overlays

The primary artifact gets the viewport.

### Approved mobile shell

Mobile is a reflowed interface, never a compressed desktop layout. Use a compact graphite top bar, clear back behavior, visible save/sync state, and 44px minimum touch targets for controls. Keep primary actions above the device safe area and above an open keyboard.

Use full-screen stage surfaces for Workspace work. The four Workspace stages appear as a horizontal, tappable stepper; they remain non-linear. Account, filters, Copilot, and inspection use one sheet at a time. Sheets support collapsed, half-height, and expanded states where the task needs them.

---

# 42. Mobile Documents

Documents should use:

* full-width reading
* approximately 16–20px side padding
* comfortable touch targets
* reduced metadata density
* collapsible secondary information

Never shrink desktop documents to fit mobile.

Reflow them.

Challenge Catalog uses an explicit search input and a filter trigger. Search updates results as the User types; active filters, result count, clear-search, clear-filters, and clear-all behavior are distinct. Filters open a bottom sheet with reset and apply/result actions. Raw URL query parameters and other backend implementation detail never appear in the interface.

Clarify keeps the current prompt, selected reasoning record, and next action visible. Answering from a document opens advisory Copilot evidence in a sheet; it never silently changes a Requirement, Assumption, Question, or Decision.

---

# 43. Mobile Canvas

Canvas should remain spatial.

Provide:

* full-screen canvas mode
* floating compact toolbar
* bottom-sheet inspector
* touch-friendly selection
* pinch zoom
* clear return to document
* searchable insertion and structured connection creation without drag

Do not attempt to display desktop rails simultaneously with the canvas.

Large-architecture arrangement may remain desktop-optimized, but essential inspection and editing cannot be desktop-only.

The approved mobile Canvas includes a 44px action dock for Add, Select, Undo, and More; explicit selection feedback; a compact gesture hint; tap-to-inspect; pinch-to-zoom; structured Component and Connection creation; delete confirmation; and a contextual inspector sheet. Dragging is a convenience, never the only way to create or connect objects.

---

# 44. Accessibility

Target WCAG 2.2 AA.

Requirements:

* sufficient contrast
* keyboard-accessible controls
* visible focus
* semantic HTML
* ARIA only when necessary
* screen-reader labels
* minimum touch targets
* reduced-motion support

Architecture state must never depend exclusively on color.

---

# 45. Component Philosophy

Build primitives before page-specific abstractions.

Core primitives:

```text
Button
IconButton
Input
Textarea
Select
Checkbox
Radio
Tabs
Tooltip
Popover
Dropdown
Dialog
Sheet
Badge
Status
Divider
Table
Callout
CommandPalette
```

Product primitives:

```text
DocumentShell
DocumentSection
StageRail
WorkspaceHeader
ContextPanel
CopilotPanel
RequirementRow
EstimateField
DecisionEntry
ScenarioBlock
ReviewFinding
ArchitectureNode
ArchitectureEdge
ArchitectureBoundary
ArchitectureInspector
```

Reuse primitives aggressively.

Do not make every screen invent its own visual grammar.

---

# 46. Iconography

## Brand Mark

Use a one-line Space Grotesk wordmark and a compact structural mark based on connected nodes or the four-stage practice loop. The mark is graphite by default, uses petrol teal for one active connection, and uses amber only for Scenario meaning. It must remain legible at 20–24px.

Do not use an AI sparkle, robot, brain, cloud, or gradient identity.

## Interface Icons

Use a single consistent icon family.

Recommended:

**Lucide**

Icons should usually be:

* 14px
* 16px
* 18px
* occasionally 20px

Avoid oversized decorative icons.

Architecture semantic icons may be slightly larger where needed.

---

# 47. Interaction States

Every interactive component must define:

```text
default
hover
active
focus-visible
disabled
loading
error
```

Selected architecture objects additionally require:

```text
selected
connected
warning
review-highlighted
```

Product-level states are part of the design, not implementation leftovers. Define and test the following where relevant:

* empty, loading, recoverable error, final error, forbidden, and quota-exceeded;
* saving, saved, offline/local-only, syncing, conflict, and explicit recovery;
* AI consent, processing, unavailable, refusal, timeout, and retry;
* Review queued, processing, completed, failed, and retryable-failed; and
* authentication field errors, verification expiry/resend, password-reset expiry, rate-limit cooldown, and temporary service unavailability.

Status language identifies the condition and the next safe action. Color reinforces meaning but never carries it alone.

---

# 48. Dark and Light Surfaces

Do not treat dark mode as simple color inversion.

Application chrome and canvas may remain naturally dark.

Documents may remain warm/light where appropriate.

The product may intentionally combine:

```text
Dark chrome
+
Light document
+
Dark architecture canvas
```

This contrast is part of the product identity.

Do not expose a global light/dark theme toggle in MVP. Chrome, paper, and Canvas are semantic surfaces rather than two invertible themes. Future display preferences may adjust contrast or document warmth without creating competing visual systems.

---

# 49. Responsive Breakpoints

Suggested starting points:

```text
Mobile       < 640px
Tablet       640–1023px
Desktop      1024–1439px
Wide         ≥ 1440px
```

Design based on available space rather than device names whenever possible.

---

# 50. Content Tone

Interface language should be:

* concise
* technically accurate
* calm
* direct
* constructive
* understandable
* engineering-peer in tone

Avoid overly playful copy.

Avoid AI hype.

Avoid aspirational or evaluative language such as `master system design`, `think like an architect`, `defend your design`, and `AI-powered`.

Bad:

> ✨ Let AI magically optimize your architecture!

Better:

> Explain this decision.

or:

> What changes under higher traffic?

Other preferred patterns include `Review the current revision`, `Two assumptions are still implicit`, and `Your work is saved`.

---

# 51. Anti-Patterns

Never default to:

* card soup
* glassmorphism
* excessive gradients
* excessive shadows
* giant rounded containers
* pill-shaped everything
* oversized dashboard KPIs
* decorative illustrations everywhere
* excessive icon usage
* excessive badges
* chatbot-first layouts
* AI-generated solution-first experiences
* gamification for its own sake
* enormous sidebars
* excessive nested panels
* low-information hero sections
* generic SaaS templates

---

# 52. Quality Test

Before accepting a screen, ask:

### Artifact

Is the user's engineering work visually primary?

### Hierarchy

Can the user identify the current context and next meaningful action quickly?

### Density

Is information compact without becoming difficult to scan?

### Restraint

Could any border, card, icon, badge, shadow, or color be removed?

If yes, consider removing it.

### Consistency

Does the screen use established primitives?

### Engineering Character

Does this feel like a serious tool for reasoning about systems?

### AI Relationship

Is Copilot helping the user think rather than replacing their thinking?

### Responsive Behavior

Does the layout recompose rather than merely shrink?

---

# 53. Product Signature

The recognizable System Design Copilot visual signature should be:

**dark engineering chrome

* warm editorial documents
* precise hairline structure
* semantic architecture canvas
* petrol-teal interaction and focus
* amber Scenario meaning
* Space Grotesk and IBM Plex typography
* contextual AI assistance**

A screenshot should be identifiable as System Design Copilot even when the logo is removed.

---

# 54. Final Rule

When choosing between:

**more visual decoration**

and

**clearer engineering information**

always choose clearer engineering information.

---

# 55. Frontend implementation primitives

The shared practice primitives live in `frontend/web/src/components/design/practice-primitives.tsx`.
Use `PracticeButton` and `PracticeLink` for primary and quiet actions, `PracticeField` for labeled inputs,
`FocusPanel` for document sections, `StageRail` for flexible Workspace stages, `EvidenceLink` for cited
evidence navigation, and `SaveStatus` for persistent save/sync state. These primitives preserve the hairline,
square workshop geometry and include visible focus, reduced-motion behavior, and semantic status announcements.

When choosing between:

**generic SaaS convention**

and

**a better representation of engineering reasoning**

choose engineering reasoning.

The interface exists to help users:

**Clarify → Design → Stress-test → Review → Improve.**
