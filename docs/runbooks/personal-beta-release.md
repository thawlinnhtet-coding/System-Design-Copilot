# Personal-Beta Release Runbook

Use this runbook only for the public, Free-only personal beta. It is a best-effort release, not a commercial launch. Record completed checks by release version and ISO date in the deployment record; do not place credentials, full Workspace content, email addresses, or dashboard links in that record.

## Release Boundary

- Every ordinary participant remains on the Free Plan. The product makes no promise of paid Pro access.
- Stripe is test mode only. Keep `STRIPE_TEST_PRO_ENABLED=false` and `STRIPE_ALLOW_ALL_TEST_USERS=false` for the public beta. A separately controlled synthetic Clerk subject may exercise test Checkout only when both are explicitly enabled in a non-public environment.
- The beta is disposable. Disclose that there is no data-recovery, backup-deletion, RPO, or RTO guarantee before registration and at account/billing boundaries.
- AI processing requires current consent, an email-verified Clerk identity, an eligible non-retaining provider route, plan quotas, request controls, and the global USD 0.10 UTC daily stop.

## Configuration Gate

Before deploying, verify managed-secret configuration without printing secret values:

| Control | Required personal-beta value or condition |
| --- | --- |
| `AI_DAILY_BUDGET_USD` | `0.10`; startup rejects a higher value. |
| `REDIS_URL` | Reachable disposable Redis instance used for rate limits and short-lived concurrency leases; never use it for product state. |
| `OPENROUTER_API_KEY` | Present only in the backend secret store. |
| `STRIPE_SECRET_KEY` | A test-mode key (`sk_test_…`) or billing disabled; never a live key. |
| `STRIPE_TEST_PRO_ENABLED` | `false` for the public beta. |
| `STRIPE_ALLOW_ALL_TEST_USERS` | `false`. |
| Clerk issuer, audience, authorized party, and JWK URL | Match the deployed Clerk instance and the public frontend origin. |
| `APP_CORS_ALLOWED_ORIGINS` | Exact deployed frontend origin only; no wildcard. |
| Review queue names and worker flags | Durable processing queue and distinct dead-letter queue configured. |

Do not set `STRIPE_SECRET_KEY`, Clerk secrets, OpenRouter keys, webhook signing secrets, database credentials, or private URLs in frontend environment variables, repository files, screenshots, or release notes. Prefer a restricted Stripe key with only the server operations needed for the test integration, and keep test and eventual commercial credentials separate.

## Deployed Smoke Journey

Run this with a disposable Clerk test User and Stripe test data after deployment:

1. From the public landing page, create a Clerk account, verify email ownership, and confirm the User begins on Free.
2. Create a Challenge, Custom Design, and supported JSON-import Workspace. Confirm each is private to the User and can be saved, resumed, and exported.
3. Grant AI Processing Consent, send one Copilot request, submit one Review, and verify the Review reaches a terminal result or a recoverable failure state without exposing private content in browser errors.
4. Withdraw consent and verify later AI operations are blocked; restore consent only through the explicit consent action.
5. Exercise the configured per-User/origin rate and concurrency boundaries with harmless requests. Confirm the response is a retryable `429` problem rather than a successful bypass.
6. Confirm an ordinary public-beta User sees the test-mode/beta billing disclosure and cannot start Checkout or gain Pro access. If an isolated non-public test subject is configured, verify Checkout returns pending until a verified test webhook projection is processed.
7. Fill the daily AI cap in an isolated environment or use an approved test fixture. The next AI operation must fail before provider invocation with `ai_daily_budget_reached`; it remains unavailable until the next UTC day.
8. Force a provider refusal or outage and a review-worker retry. Confirm terminal status, retry/dead-letter handling, and safe User-facing recovery guidance.

Record only release version, timestamps, operation/review IDs, result codes, and the operator who performed the test.

## Safe Operational Telemetry

Use application logs and read-only operational queries that select identifiers, timestamps, status, model, token counts, cost, and error codes only. Never select `accepted_output`, `reviews.output`, Architecture Document JSON, Copilot text, JWTs, webhook signatures, or email addresses for telemetry.

| Need | Safe source | Alert or investigation condition |
| --- | --- | --- |
| Provider outcome, latency, token/cost, daily-cap rejection | `ai_operation_records` (`id`, profile, status, model, token/cost fields, latency, outcome code, timestamps) | Any provider failure spike, unexpected model, or budget rejection before expected cap use. |
| Review correlation and state | `review_requests` joined to `review_jobs` by request ID | Processing age above 90 seconds, retrying requests, or terminal failures. |
| Queue publication and retries | `review_outbox_events` and `review_jobs` (`status`, attempts, failure code, timestamps) | Pending outbox backlog, attempts approaching max, or publish failures. |
| Dead letters | configured `review-processing-dead-letter` queue and `review_jobs.status=DEAD_LETTERED` | Any new dead letter requires triage before widening availability. |
| Quota and abuse-control decisions | RFC 9457 response code and safe code (`public_beta_rate_limited`, `adaptive_verification_required`, entitlement quota code) | Sustained throttling, unusual origin patterns, or repeated verification escalation. |
| Redis rate-limit health | Actuator Redis health plus safe rate-limit error codes | Any `rate_limit_unavailable` response pauses promotion until the disposable guard is healthy. |
| Billing test-mode health | Stripe test webhook receipt/projection status and safe event ID | A live-mode event, signature failure, or ordinary User receiving Pro is a release stop. |

AI operation admission is serialized through a durable database guard. Accepted and provider-failed attempts reserve their estimated cost in the operation record; budget rejections are recorded with zero charged cost. This intentionally favors a safe early stop over reclaiming a failed provider attempt whose upstream charge cannot be proven absent.

## Incident Actions

- **USD 0.10 cap reached:** Leave the safe stop in place until the next UTC day. Do not raise the cap, switch providers, or enable fallback to satisfy a request.
- **Provider failure or no eligible provider:** Keep consent and non-retaining routing requirements intact; show the recoverable unavailable state and investigate safe provider metadata.
- **Queue retry/dead letter:** Pause promotion, inspect job/request IDs and safe error codes, then retry only through the supported Review lifecycle after the root cause is corrected.
- **Stripe guard failure:** Disable billing endpoints by keeping test Pro disabled, rotate exposed credentials immediately if applicable, and investigate only with verified test events.
- **Unexpected data-loss request:** State the beta no-recovery guarantee. Do not claim a backup, restore, or deletion-tombstone capability that has not been independently exercised.

## Commercial Launch Is Blocked Until

The personal beta must not be relabeled or promoted to commercial launch until all of the following have been independently verified:

- Commercial-eligible frontend hosting and real-payment approval; Stripe live mode remains disabled before then.
- Paid broker capacity and production load validation.
- Encrypted independent PostgreSQL backups, a documented restore drill, deletion-tombstone replay, and recorded recovery result meeting the internal 24-hour RPO and 8-hour RTO targets.
- Production observability and alerting for API, provider, queue, retry, dead-letter, quota, webhook, and cost signals.
- Revalidated provider terms, abuse controls, managed-service limits, privacy controls, and deployment smoke journey.

Commercial billing may create tax obligations. Before enabling real payments, configure and validate the applicable Stripe Tax registrations and recurring-payment tax treatment; do not rely on `automatic_tax` without active registrations.
