# 03 - Practice Home And Navigation

**What to build:** Redesign Practice Home as a calm practice launcher and establish navigation between Practice, Challenges, Progress, and active Workspaces.

**Blocked by:** 01 - Design Foundations And Brand.

**Status:** complete

**Implementation edges:** 19 - Workspace Types And Sources; 20 - Custom Design Workspace Flow.

## Comments

- 2026-08-16: Practice Home, shared Practice/Challenges/Progress navigation, Workspace type/source metadata, public Challenge entry, custom-design entry, and qualified Progress framing are implemented in the current frontend shell.

- [ ] Practice prioritizes the most relevant unfinished Workspace, recommended next Challenge, recent Workspaces, Topic progression, Custom Design or Architecture Review entry, and exploration of all Challenges.
- [ ] Workspace cards and resume actions show Workspace Type and Workspace Source when relevant.
- [ ] Challenges is a clear entry point for curated practice without turning Practice Home into a marketplace.
- [ ] Progress shows qualified evidence from Decisions, Scenarios, Review changes, and open questions.
- [ ] Progress does not lead with streaks, badges, arbitrary points, or unsupported causal claims.
- [ ] Navigation uses the shared Lucide icon mapping, visible labels, keyboard focus, and responsive behavior.
- [ ] Global navigation contains only Practice, Challenges, and Progress; Account, Plan & Billing, settings, and data utilities remain secondary.
- [ ] Workspace-specific capabilities remain inside the active Workspace rather than becoming global destinations.
- [ ] Public landing uses `Explore Challenges`; authenticated landing uses `Continue practice`; Challenge Detail uses `Start practice` where the destination is concrete.
- [ ] Custom Design Workspace creation asks only for a Workspace name and System Idea before opening the guided blank start.
- [ ] New Users choose a starting path without a long onboarding wizard.
