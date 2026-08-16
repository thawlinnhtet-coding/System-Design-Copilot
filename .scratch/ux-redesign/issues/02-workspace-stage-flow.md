# 02 - Workspace Stage Flow

**What to build:** Redesign the active Workspace as a flexible Clarify, Design, Stress-test, and Review flow with a visible current goal and next action.

**Blocked by:** 01 - Design Foundations And Brand.

**Status:** complete

**Implementation edge:** 20 - Custom Design Workspace Flow.

## Comments

- 2026-08-16: The active Workspace now uses the flexible Clarify, Design, Stress-test, and Review rail, with persisted focus, visible goal/next action, blank custom-start Canvas context, reasoning, Scenario, Review, Copilot, and save/conflict/offline states supplied by the existing Workspace shell and editor.

- [ ] The Workspace opens in a focused stage surface inside the existing Workspace domain object.
- [ ] The current goal and next action remain visible while the User moves between Canvas, reasoning, Scenarios, and Reviews.
- [ ] Clarify, Design, Stress-test, and Review appear as lightweight navigation labels and do not enforce a linear workflow.
- [ ] Custom Design Workspace opens on Clarify with a problem brief, compact reasoning list, optional first Requirement, blank Canvas context, and a clear next action.
- [ ] The User can skip the first Requirement, open the full Canvas, and return to the suggested next action without losing context.
- [ ] Clarify presents a problem brief plus compact Requirements, Assumptions, estimates, and unresolved Questions with inline editors or drawers.
- [ ] Design makes the Canvas nearly full-screen with a compact palette/command search and one contextual inspector or panel at a time.
- [ ] Stress-test preserves the changed condition while the User adapts the Architecture Document and links evidence.
- [ ] Review leads with interpretation, strengths, prioritized risks, evidence-linked Findings, uncertainty, next actions, supporting dimensions, and history.
- [ ] Copilot guidance leads with one sharp question, provides optional depth, and carries a subtle provenance label.
- [ ] Save, conflict, offline, validation, and saved states use the reusable persistent status pattern.
- [ ] The custom Workspace empty state remains blank of generated architecture while offering a framing prompt and first Requirement action.
