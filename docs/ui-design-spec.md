# UI Design Specification

Status: Superseded by repository-root `DESIGN.md`; retained as historical browser-review material
Owner: Frontend
Related brief: `docs/design-visual-direction.md`
Research: `docs/research/ui-design-workflow.md`

This document records the earlier implementation-facing UI contract for the first frontend redesign. It is not authoritative. Product behavior and domain terminology remain governed by `docs/product/PRD.md` and `CONTEXT.md`; visual and interaction design are governed by repository-root `DESIGN.md`.

## Design Intent

System Design Copilot is a quiet engineering workshop: serious, focused, technical, and built for active reasoning rather than passive dashboard consumption.

The interface should communicate:

- Here is the system. Think through it.
- Architecture and reasoning artifacts are the foreground.
- Requirements, Assumptions, estimates, Decisions, Scenarios, and Reviews are working materials.
- Navigation and status chrome remain quiet and supportive.
- One meaningful task is visually dominant on every screen.

The product is document-first, not dashboard-first. Primary views are focused working or reading surfaces rather than collections of cards, KPI tiles, or equal-weight panels.

## Historical Source Hierarchy

1. `CONTEXT.md` owns domain language and invariants.
2. `docs/product/PRD.md` owns product behavior and requirements.
3. Repository-root `DESIGN.md` owns UI composition, tokens, interaction states, responsive behavior, and accessibility acceptance criteria.
4. Frontend code and tests own the behavior that actually ships.
5. No Pencil artifact is required. Any `.pen` file that exists is an optional visual reference only; raw `.pen` editing is not part of the workflow.

## First Review Scope

The browser prototype must show one coherent core slice, not a gallery of unrelated screens:

- Practice Home for a returning User
- Workspace shell with persistent stage navigation
- Clarify stage
- Design stage with a schematic Canvas and shared contextual rail
- Collapsed and expanded Copilot states
- Desktop and mobile variants
- Light and dark semantic themes

The prototype is read-only and may use realistic static content. It must be visibly marked as `PROTOTYPE - NOT PRODUCTION` and removed or promoted after approval.

## Visual Tokens

### Typography

| Role | Token | Intended family |
| --- | --- | --- |
| Document headings, prompts, briefs, Review interpretation | `font-display` | Editorial/document family chosen according to `DESIGN.md` |
| Body copy, interface controls, descriptions | `font-body` | Inter, Geist, or equivalent neutral sans |
| Stage labels, identifiers, Component Types, protocols, numeric metadata | `font-mono` | Geist Mono, JetBrains Mono, or equivalent |

Normal navigation and product copy use sentence case. Uppercase monospace is an annotation layer only.

### Light Semantic Palette

| Token | Value | Meaning |
| --- | --- | --- |
| `paper` | `#F7F6F2` | Warm document surface |
| `paper-subtle` | `#F1F0EB` | Subtle document surface |
| `paper-raised` | `#FCFBF8` | Raised document surface |
| `text-primary` | `#17191C` | Primary text |
| `text-secondary` | `#5E6369` | Supporting text |
| `text-muted` | `#8B9096` | Muted metadata |
| `accent` | `#4F6EF7` | Interaction and focus |
| `success` | `#27865B` | Successful or verified state |
| `warning` | `#B7791F` | Warning state |
| `danger` | `#C94A4A` | Destructive or critical state |

Color is syntactic, not decorative. Use the smallest colored surface that communicates meaning: a rule, glyph, label, focus ring, selection border, or text. Do not tint neutral panels simply to add visual interest.

### Dark Semantic Palette

| Token | Value | Meaning |
| --- | --- | --- |
| `chrome-950` | `#0B0D0F` | Deep application chrome |
| `chrome-900` | `#111417` | Primary application chrome |
| `chrome-850` | `#171A1E` | Secondary chrome surface |
| `chrome-800` | `#1C2024` | Raised chrome surface |
| `text-on-dark` | `#F2F3F3` | Primary dark-surface text |
| `text-on-dark-secondary` | `#A9AEB3` | Supporting dark-surface text |
| `canvas` | `#101316` | Architecture Canvas plane |
| `canvas-grid` | `#20252A` | Subtle Canvas grid |
| `accent` | `#4F6EF7` | Interaction and focus |
| `accent-hover` | `#405EE5` | Hovered interaction |

### Geometry And Motion

- Default corner radii are 4px to 6px; large surfaces remain at 6px to 8px maximum.
- Use 1px hairline rules for structure.
- Use flat layered surfaces and no elevation for normal content.
- Reserve subtle shadows for temporary menus, command palettes, dialogs, drag states, and elevated Canvas tools.
- Do not use gradients, glow, decorative color fields, or ubiquitous rounded cards.
- Use quiet 150ms to 240ms transitions for stage changes, rail expansion, save state, and focus.
- Respect `prefers-reduced-motion`.

## Shell Anatomy

### Authenticated Desktop

```text
global text navigation strip: 28px to 32px
  Practice       Challenges       Progress                         Account

workspace shell:
  stage column 56px to 64px | top toolbar 32px to 36px
                         | dominant document                 | shared rail trigger
                         |                                    |
                         | Copilot 36px to 40px collapsed    |
```

Global navigation remains structurally present inside a Workspace but recedes through lower contrast. It contains text links, not icons, pills, or colored backgrounds.

The product maps the canonical reasoning flow into four stacked interface stages:

1. Clarify
2. Design
3. Stress-test
4. Feedback

Clarify covers the brief, Requirements, Assumptions, and estimation; Design covers the Architecture Canvas and Decisions; Stress-test covers Scenarios; Feedback covers Reviews. These are interface surfaces, not new domain entities or a required sequence.

Each stage is an independent document surface. Switching stages replaces the dominant document and does not form a blocking wizard.

The top toolbar contains only:

- Workspace name on the left
- Undo and redo near the center-left
- Zoom near the center-right when relevant
- `Review` or `Review design` on the right

It does not contain global navigation, avatar controls, stage tabs, or large save banners.

### Contextual Rail

The right side has one shared contextual rail region. It can show either:

- Component palette and command search
- Selected Component inspector
- Contextual supporting content for the active stage

The rail collapses to a 48px to 56px trigger strip. When opened, it pushes or resizes the dominant surface. It never floats over the work and never leaves a dead gutter when closed.

### Copilot Companion

Copilot is a context-aware companion, usually presented as a right-side panel on desktop:

- Collapsed: a compact trigger or narrow panel strip
- Expanded: a structured reasoning panel sized to preserve the primary artifact
- It pushes or resizes the dominant surface
- It follows the active stage and current selection
- It remains subordinate to the User's work
- Save state remains visible without dominating the artifact

The first AI operation requires explicit bounded-context consent. Copilot asks questions and explains trade-offs; it never silently mutates the Architecture Document.

## Surface Specifications

### Practice Home

Practice Home is an action-ordered practice document, not a dashboard.

Order:

1. Next meaningful action: the most recent Workspace and one `Continue` action
2. Other active Workspaces
3. Recommended Challenges
4. Recent completed work or Reviews

Entries are continuous vertical index rows separated by whitespace and hairline rules. Prominence comes from typography, alignment, and composition. Do not use card grids, KPI tiles, progress widgets, or colored containers.

### Challenge Catalog

Challenges are editorial entries grouped by Topic Pack. Each entry contains:

- Classification and Topic Pack label
- Challenge title
- Problem description
- Skill coverage
- Estimated practice time
- Completion or active state
- Plan availability
- One primary action

Difficulty and skills are metadata. Pro access changes the annotation and action, not the entry structure. Hover and selection reinforce rules and typography rather than elevation.

### Clarify

Clarify is a scrollable reasoning document containing:

- Problem brief
- Requirements list with kind, priority, status, and target where relevant
- Assumptions and capacity estimates
- Unresolved Questions
- Inline editors or focused drawers

The primary question is visible near the top: what is being built, and why? Requirements and Assumptions are first-class working materials, not dashboard metrics.

### Design

Design is a nearly full-screen schematic Canvas.

- Components are compact flat symbols with near-square geometry.
- Component Type uses monospace.
- User-authored names use the body sans-serif.
- Connections use thin neutral lines.
- Direction, line pattern, and labels communicate Connection semantics before color.
- Boundaries use dashed outlines, not filled containers.
- Selection uses the restrained primary accent exclusively.
- Review evidence appears as small annotations and never recolors the architecture.
- No decorative elevation, glow, gradients, or cloud-provider logos.
- Essential actions have keyboard and non-drag alternatives.

The right rail shows either the Component palette or the selected Component inspector, never both simultaneously.

### Stress-test

Stress-test is a response document:

1. Changed condition or Scenario remains visible.
2. User response is the main editable surface.
3. Architecture and Decision changes are linked as evidence.
4. The next Scenario is available without forcing linear completion.

Use a compact architecture schematic only as supporting context. The Scenario and the User's reasoning remain primary.

### Feedback

Feedback is evidence-first. Order:

1. Interpretation
2. Strengths
3. Risks
4. Uncertainty and missing information
5. Evidence-linked Findings
6. Prioritized next actions
7. Rubric dimensions as supporting detail
8. Review history and comparison

Do not lead with a composite score, pass/fail claim, or KPI dashboard.

### Progress

Progress is a reflective practice journal. It explains how reasoning is developing through completed Challenges, Reviews, Findings, demonstrated skills, and revision changes.

Use a summary statement, reverse-chronological Review entries, comparable trends only when evidence is sufficient, and one next-practice suggestion. Do not use streaks, badges, leaderboards, arbitrary percentages, or gamification.

### Account And Billing

Account is a settings document, not a pricing dashboard. Present Plan, usage allowances, renewal timing, billing actions, import/export utilities, and beta disclosures as ordered sections with rules and plain-language explanations. Show upgrade actions at contextual capability boundaries without hiding existing work.

## Responsive Behavior

Mobile preserves information hierarchy, not desktop geometry.

- Global navigation collapses behind a compact trigger.
- The dominant document remains primary.
- The stage column becomes a compact bottom stage navigation.
- The shared right rail becomes a temporary drawer or bottom sheet.
- Copilot remains a compact contextual trigger or panel and expands as a sheet.
- Canvas tools appear only when requested.
- Essential actions remain keyboard-accessible where supported and never depend on drag alone.
- Save, processing, quota, conflict, and error states remain visible.

## Interaction And Accessibility

- Target WCAG 2.1 AA for core flows.
- Preserve visible keyboard focus with a 2px focus ring and 3px offset.
- Use semantic headings, labels, landmarks, and status announcements.
- Do not communicate state through color alone.
- Keep primary touch targets at least 44px where practical.
- Do not hide required actions behind hover-only behavior.
- Test empty, loading, error, forbidden, quota-exceeded, conflict, offline, retryable failure, and completed states.

## Approval Checklist

The browser prototype is ready for approval when:

- The first meaningful action is identifiable within a few seconds.
- The dominant surface is obvious without reading every label.
- The UI feels like an engineering workshop rather than a SaaS dashboard.
- No normal surface depends on a card grid or elevation for hierarchy.
- The primary blue accent appears only for interaction and focus.
- Semantic colors appear only when they communicate success, warning, danger, or information.
- Typography clearly distinguishes editorial content, interface copy, and technical annotation.
- Workspace stage navigation remains visible but quiet.
- The right rail and Copilot resize the work instead of covering it.
- Desktop and mobile preserve the same information hierarchy.
- Keyboard focus, labels, contrast, and non-drag alternatives are visible.
- Loading, empty, error, and save states are understandable without visual guesswork.

## Implementation Boundary

The first production slice should be implemented only after browser review approval. Split implementation by vertical outcome:

1. Theme variables, fonts, rules, focus styles, and shared primitives
2. Global navigation and Workspace shell
3. Practice Home and resume behavior
4. Clarify reasoning surface
5. Design Canvas shell and shared contextual rail
6. Copilot consent and companion states
7. Stress-test and Feedback
8. Responsive, accessibility, state, and browser hardening

The prototype should either be promoted into the first ticket's implementation or removed. It must not become a second undocumented source of truth.
