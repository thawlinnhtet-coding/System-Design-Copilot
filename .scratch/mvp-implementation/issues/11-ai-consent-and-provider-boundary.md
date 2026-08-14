# 11 - AI Consent And Provider Boundary

**What to build:** A User can grant or withdraw AI Processing Consent, while the backend invokes the configured AI profiles only through privacy-preserving OpenRouter routing and an enforced personal-beta budget.

**Blocked by:** 03 - Free Plan And Usage Policy.

**Status:** complete

- [x] AI Processing Consent and its policy version are durable and withdrawal blocks new AI operations.
- [x] First-use consent explains bounded Workspace context, provider privacy routing, revocability for future operations, and that already-sent context cannot be retracted.
- [x] The consent UI shows an inspectable bounded summary of included categories and excluded categories without allowing arbitrary cross-Workspace context selection.
- [x] Withdrawal immediately disables future Copilot and Review AI operations, preserves existing content, and offers an explicit re-consent path.
- [x] The backend uses the selected Copilot and Review profiles with `data_collection: "deny"` and provider fallback disabled.
- [x] The USD 0.10 UTC daily cap, provider failure, and no-eligible-provider state are observable and safe.
- [x] AI context is limited to relevant bounded Workspace content; credentials, tokens, account data, unrelated Workspaces, and raw provider payloads are excluded.
- [x] User-authored Workspace text is framed as untrusted data and cannot override system instructions or directly mutate product state.
- [x] Fixed Copilot and Review profiles use non-retaining provider routing with fallback disabled.
- [x] Accepted output and safe model/provider/prompt/token/latency/cost metadata are persisted without full private prompts in operational logs.

## Comments

2026-08-14: Completed in `ticket-11-ai-consent`. Added the shared authorized AI operation boundary for future Copilot and Review callers, global USD 0.10 UTC-day budget accounting, safe provider-failure/no-eligible-provider outcomes, durable accepted-output and safe metadata records, and the live account consent UI/API integration. Backend `mvn verify`, frontend lint, typecheck, 45 tests, and production build pass. Full private prompts and raw provider payloads are not persisted; downstream Copilot and Review journeys consume this boundary in tickets #12 and #14.
