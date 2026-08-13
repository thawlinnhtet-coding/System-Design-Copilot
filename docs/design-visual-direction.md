# Visual Direction

Status: frontend flow approved; visual direction is governed by repository-root `DESIGN.md`

This document records the visual and product decisions agreed during the focused grilling session. It is a design brief, not an implementation specification.

The implementation-facing source of truth is the repository-root `DESIGN.md`. A browser prototype is the approval baseline for hierarchy, responsive behavior, interaction states, and accessibility. A Pencil file is optional and is not required for approval.

## Product Center

- The authenticated landing surface is presented as **Practice Home** at the `/practice` route.
- Returning Users see in-progress Workspaces first and can continue practice immediately.
- New Users see **Start with a Challenge** as the primary action.
- **Create custom Workspace** is a secondary path for experienced Users.
- `Practice Home` is a UI surface, not a new domain entity.

## Frontend Review Baseline

- The current frontend has a stronger visual identity than a generic dashboard, but the implemented routes still expose mostly setup and account surfaces rather than the full Clarify, Design, Stress-test, and Feedback loop.
- The current app shell mixes global navigation with Workspace context; the redesign separates those levels and makes the active Workspace stage persistent inside the Workspace.
- Practice Home should be resume-first with one dominant next action. Workspace management actions belong in a secondary menu rather than competing with `Continue`.
- Challenge browsing should become a real public-safe catalog and prompt detail flow instead of a placeholder state.
- Progress should lead with practice evidence and Review history, not stat tiles as the primary story.
- The Architecture Canvas needs a semantic outline and non-drag alternatives so mobile and keyboard users are not forced into spatial interaction.
- AI should be a subordinate reasoning companion with explicit consent and bounded-context disclosure, never the main visual surface.

## Visual Direction

- Use a **modern editorial-technical** aesthetic: authored, precise, and focused on engineering thought rather than SaaS dashboard metrics.
- Use a modern neutral UI sans such as **Inter** or **Geist** for navigation, controls, labels, forms, and application chrome. Give document headings a stronger editorial presence without requiring a specific display family. Use **Geist Mono** or **JetBrains Mono** selectively for technical metadata, identifiers, protocols, and numeric values.
- Use dark neutral application chrome, warm light document surfaces, and a restrained blue interaction accent. Use semantic green, amber, red, and blue only for meaning. Do not use gradients, purple AI palettes, glow, or decorative color fields.
- Support Light and Dark themes as one semantic design system. Default to the system theme, allow a persisted manual Light/Dark override, and use Light as the fallback.
- Keep normal navigation and content in sentence case. Use mono as an annotation layer, not as a substitute for readable product copy.
- Use Lucide, or one equivalent consistent icon family, for UI controls. Architecture Component Types should use simple, vendor-neutral symbols that remain stylistically consistent with the interface. Do not use cloud-provider logos as semantic architecture icons.
- Use focused density globally: one dominant task per screen, a persistent narrow practice rail, and selective context rails or collapsible panels. Avoid equal-card grids and excessive dashboard chrome.
- Use quiet engineering-workshop surfaces: mostly square 4-6px geometry, 1px hairline rules, restrained elevation, dark canvas planes, and warm paper layers only where they communicate meaning.
- Use structural architecture-and-evidence visuals instead of generic AI illustrations or decorative SaaS graphics.
- Use quiet state motion only: 150-240ms transitions for stage changes, save/review state, focus, and panel collapse. Respect `prefers-reduced-motion`.

## Navigation And Entry Flows

- Use lightweight global navigation for Practice, Challenges, and Progress.
- Use focused contextual navigation inside a Workspace.
- Use a dedicated branded `/sign-in` page rather than a visually disconnected modal.
- Keep Clerk as the authentication boundary and customize its presentation to match the product themes.
- Return Users to an intended deep link after authentication when one exists; otherwise return them to Practice Home.
- Remove backend health/version diagnostics from the normal signed-out landing experience.
- Present the signed-out landing page as a learner-facing introduction to the practice loop: clarify, design, stress-test, and improve from Feedback.

## Practice Home

- Above the fold, prioritize `Start with a Challenge`, `Continue Workspace` when applicable, recommended Challenges, and compact progress context.
- Avoid oversized analytics panels, decorative hero illustrations, and generic dashboard decoration.
- Workspace cards show the name, Type, Source, description, progress, save state, and latest Review state when available.
- Workspace cards have one primary `Continue` action; Rename, Archive, and Delete are secondary menu actions.
- Challenge cards show the problem, difficulty, skill tags, estimated practice time, Plan availability, and `Start Challenge`.
- Progress emphasizes reflective practice history, completed Reviews, and sufficiently comparable trends rather than streaks, points, badges, or leaderboards.

## Workspace And Learning Surfaces

- Express the reasoning stages through the product's four interface surfaces: Clarify covers the brief, requirements, assumptions, and estimation; Design covers architecture and decisions; Stress-test covers scenarios; Feedback covers review. These surfaces remain freely navigable and non-blocking.
- Make the Architecture Document the primary Design surface inside the Workspace, while Clarify, Stress-test, and Feedback each receive their own focused surface.
- Use contextual supporting panels for Requirements, Assumptions, Decisions, Scenarios, Reviews, and Copilot guidance.
- Use a split-screen studio for architecture work: the Canvas remains dominant while one contextual rail is open at a time and can collapse for more room.
- Keep save and Review states visible without dominating the canvas.
- Make Copilot a reasoning companion rail: one contextual question at a time, collapsible, evidence-aware, and visually subordinate to the user's work.
- Keep Copilot guidance focused on clarification, trade-offs, explanations, and failure modes rather than generated complete architectures.
- Present completed Feedback evidence-first: interpretation, strengths, risks, evidence links, uncertainty, and prioritized actions lead; rubric scores support that explanation.

## Responsive And Accessibility Requirements

- Treat mobile as a first-class simplified workflow, not a shrunken desktop layout.
- Keep Practice Home, Challenge browsing, essential Workspace actions, and Review Findings usable on narrow screens.
- Convert contextual panels to full-screen sheets or stacked panels on mobile.
- Provide non-drag alternatives for essential canvas actions.
- Target WCAG 2.1 AA from the design stage.
- Maintain visible keyboard focus, contrast-safe themes, clear labels, accessible error placement, practical touch targets, and non-color-only status communication.

## First Visual Review Scope

The first `.pen` artifact should include:

- Light and Dark semantic token samples.
- Typography, spacing, color, border, radius, and surface samples.
- Buttons, inputs, cards, status badges, navigation, contextual panels, and menus.
- Signed-out landing page.
- Dedicated branded sign-in page.
- Empty Practice Home.
- Populated Practice Home.
- Challenge cards and Workspace cards.
- Clarify problem brief and reasoning list.
- Canvas-first Design surface with contextual palette and inspector.
- Focused Stress-test Scenario workspace.
- Evidence-first Feedback workspace with history comparison.
- Branded Sign in and Register routes.
- Architecture Review import entry and Workspace export utility.
- Account Plan & Billing and contextual usage-boundary states.
- Desktop and mobile variants.
- Loading, empty, error, and quota-boundary states where they affect layout.
- At least one restrained panel transition or state transition for motion review.

## Copy Tone

- Use a calm, direct, evidence-aware practice-coach voice.
- Prefer concrete actions such as `Start Challenge`, `Continue Workspace`, and `Review Design`.
- Explain why an action matters without hype or exaggerated AI claims.
- Use the canonical terms `Workspace`, `Challenge`, `Review`, `Finding`, and `Copilot` consistently.

No production application code or Clerk configuration should change until the Markdown design contract and representative browser prototype are reviewed and approved. Exploratory prototype code is allowed when it is clearly marked as throwaway and isolated from production flows.

## Regrilled Frontend Flow

- Returning Users enter a resume-first Practice Home with one clear next action, recent Workspaces, and secondary Challenge/Custom paths.
- New Users choose Start with a Challenge or Create a Custom Design without a long onboarding wizard.
- Global navigation contains Practice, Challenges, and Progress. Account, Plan & Billing, settings, and data utilities remain secondary. Workspace-specific capabilities stay inside a Workspace.
- Workspace stages are Clarify, Design, Stress-test, and Feedback. They remain freely navigable and do not form a required wizard.
- Clarify is a focused problem brief plus compact Requirements, Assumptions, estimates, and unresolved Questions list with inline editors or drawers.
- Design is a nearly full-screen Canvas with compact palette/command search, one contextual inspector, stage navigation, autosave, zoom, Undo/Redo, and architecture context.
- Stress-test preserves the changed condition while the User adapts the Architecture Document, explains the response, and links evidence.
- Feedback leads with interpretation, strengths, risks, uncertainty, Findings, and next actions. Previous Feedback checkpoints and comparison live inside the Feedback stage.
- Import appears only in the Architecture Review entry flow. Export is a Workspace utility with a portable-content preview.
- Billing lives under Account -> Plan & Billing and appears contextually at Pro capability or usage boundaries without hiding existing work.
- Authentication uses branded Sign in and Register routes, preserves intended destinations, and keeps public Challenge discovery available while signed out.
- Signed-out landing follows Promise -> Loop -> Evidence -> representative Challenges -> Build judgment philosophy -> Trust & Public Beta -> Start practicing.
- Mobile uses a purpose-built shell with compact top bar, bottom navigation, full-screen stage surfaces, sheets for secondary tools, and continuously visible save/sync state. The landing page preserves the desktop narrative in sequential stacked sections with reduced copy, large touch targets, a vertical evidence artifact, and editorial Challenge rows rather than dense grids or carousels.
- Save, processing, quota, and error states remain contextual and persistent; full-screen blockers are reserved for surfaces that cannot function otherwise.
