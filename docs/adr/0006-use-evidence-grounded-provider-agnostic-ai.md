---
status: accepted
date: 2026-08-02
---

# Use Evidence-Grounded Provider-Agnostic AI

Depend on application-owned Copilot and Review interfaces and implement the initial provider adapter with Spring AI against OpenRouter's OpenAI-compatible API. Keep model identifiers configurable, require schema-validated structured Review output, and link Findings to stable evidence from the reviewed Workspace.

## Considered Options

- Call one model and provider directly from controllers.
- Allow free-form Review prose and parse it loosely in the UI.
- Abstract provider access and validate structured, evidence-linked output in the backend.

Direct provider coupling makes model-price changes and provider failure policy invasive. Free-form output cannot reliably support scores, evidence links, comparisons, or safe persistence. An application-owned boundary permits budget-aware model changes while retaining a stable product contract.

## Consequences

- Prompt templates and output schemas become versioned product artifacts.
- Model, provider request ID, token, cost, and prompt-version metadata are retained for audit and tuning; raw provider payloads are not retained by default.
- Bounded context assembly must defend against prompt injection and accidental private-data expansion.
- Malformed, unsupported, or ungrounded output fails safely rather than becoming a completed Review.
- Provider portability is not assumed to be free; model behavior must be benchmarked before changing defaults.
