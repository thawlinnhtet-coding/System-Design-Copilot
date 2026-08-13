# 11 - AI Consent And Provider Boundary

**What to build:** A User can grant or withdraw AI Processing Consent, while the backend invokes the configured AI profiles only through privacy-preserving OpenRouter routing and an enforced personal-beta budget.

**Blocked by:** 03 - Free Plan And Usage Policy.

**Status:** ready-for-agent

- [ ] AI Processing Consent and its policy version are durable and withdrawal blocks new AI operations.
- [ ] First-use consent explains bounded Workspace context, provider privacy routing, revocability for future operations, and that already-sent context cannot be retracted.
- [ ] The consent UI shows an inspectable bounded summary of included categories and excluded categories without allowing arbitrary cross-Workspace context selection.
- [ ] Withdrawal immediately disables future Copilot and Review AI operations, preserves existing content, and offers an explicit re-consent path.
- [ ] The backend uses the selected Copilot and Review profiles with `data_collection: "deny"` and provider fallback disabled.
- [ ] The USD 0.10 UTC daily cap, provider failure, and no-eligible-provider state are observable and safe.
- [ ] AI context is limited to relevant bounded Workspace content; credentials, tokens, account data, unrelated Workspaces, and raw provider payloads are excluded.
- [ ] User-authored Workspace text is framed as untrusted data and cannot override system instructions or directly mutate product state.
- [ ] Fixed Copilot and Review profiles use non-retaining provider routing with fallback disabled.
- [ ] Accepted output and safe model/provider/prompt/token/latency/cost metadata are persisted without full private prompts in operational logs.
