# 16 - Progress And History

**What to build:** A User can view recent activity, usage, Review history, and qualified trends for an owned Workspace.

**Blocked by:** 15 - Review Experience.

**Status:** complete

**UI delivery:** Implement this ticket's user-facing desktop and mobile states from `ui_design`; keep backend ownership and validation authoritative, and add or update a Playwright journey for the completed flow.

- [x] Recent activity and completed Reviews are visible only to the owning User.
- [x] Trend displays distinguish practice volume from Review-score changes.
- [x] The product avoids unsupported claims of skill improvement.
- [x] Progress aggregates safe global activity and practice volume across owned Workspaces while keeping Review comparisons Workspace-scoped by default.
- [x] Progress shows Scenario completion and qualified comparable dimension-score changes without streaks, badges, or a composite skill score.

## Comments

- 2026-08-16: Added the authenticated `/api/v1/me/progress` aggregate and the Progress page integration. Activity, Scenario completions, and Review completions are queried strictly for the current User. Review trends compare only shared dimensions from the latest two completed immutable Reviews in each owned Workspace; the UI identifies them as evidence to inspect, never proof of skill improvement. Added an authenticated Playwright journey and scoped backend coverage.
