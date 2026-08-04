# 11 - AI Consent And Provider Boundary

**What to build:** A User can grant or withdraw AI Processing Consent, while the backend invokes the configured AI profiles only through privacy-preserving OpenRouter routing and an enforced personal-beta budget.

**Blocked by:** 03 - Free Plan And Usage Policy.

**Status:** ready-for-agent

- [ ] AI Processing Consent and its policy version are durable and withdrawal blocks new AI operations.
- [ ] The backend uses the selected Copilot and Review profiles with `data_collection: "deny"` and provider fallback disabled.
- [ ] The USD 0.10 UTC daily cap, provider failure, and no-eligible-provider state are observable and safe.
