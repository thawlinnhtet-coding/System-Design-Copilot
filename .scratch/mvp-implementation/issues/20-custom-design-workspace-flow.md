# 20 - Custom Design Workspace Flow

**What to build:** A Custom Design Workspace starts quickly from a name and System Idea, then guides the User through an editable blank practice loop without generating an architecture.

**Blocked by:** 05 - Custom Workspace Lifecycle; 06 - Workspace Reasoning; 07 - Architecture Document Contract; 08 - Architecture Canvas; 19 - Workspace Types And Sources.

**Status:** complete

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] Creation requires only Workspace name and System Idea.
- [x] Creation opens a Clarify focus with a fixed framing prompt, optional first Requirement, blank Canvas context, and suggested next action.
- [x] Clarify, Design, Stress-test, and Review remain visible flexible stages rather than a blocking wizard.
- [x] The initial Architecture Document contains no generated Components or Connections.
- [x] The User can skip the first Requirement and open the full Canvas without losing context.
- [ ] The User can progressively add Requirements, Assumptions, estimates, Decisions, Components, Connections, and Scenarios.
- [x] The flow exposes Copilot and Review as later Workspace stages without implementing their processing behavior; those behaviors belong to tickets 12, 14, and 15.
- [x] Resume restores the last saved focus, panel, and Canvas viewport when available.

## Comments

- Implemented and merged into `main` in commit `1535474`.
- Frontend typecheck and 55 frontend tests passed; the full backend Maven test suite passed.
- The implementation review recorded follow-up hardening for the Copilot/Review journey and Playwright coverage.
- The follow-up implementation adds an explicit opt-in Copilot surface, non-blocking Scenario and Review stage states, and a mobile/private-boundary browser journey. Scenario creation remains owned by Ticket 13.
