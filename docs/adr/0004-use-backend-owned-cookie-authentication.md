---
status: superseded by ADR-0009
date: 2026-08-02
---

# Use Backend-Owned Cookie Authentication

Let Spring Security own email/password authentication, Google OIDC, GitHub OAuth, authorization, and session renewal. Deliver a short-lived JWT access token in a Secure, HttpOnly cookie and rotate an opaque refresh token whose hash is stored in PostgreSQL; protect mutating requests with CSRF controls.

## Considered Options

- Store bearer JWTs in browser local storage.
- Use a frontend authentication framework as the identity authority.
- Use server-side opaque sessions only.
- Use backend-owned JWT access cookies with rotating refresh tokens.

Local-storage bearer tokens increase the impact of script injection. A frontend identity authority would split security policy across Next.js and Spring and complicate backend ownership enforcement. Fully opaque sessions are viable but do not match the selected JWT requirement. Backend-owned cookies keep tokens inaccessible to JavaScript and establish Spring as the policy boundary.

## Consequences

- Production requires deliberate cookie, CORS, CSRF, and custom-domain configuration; sibling `app` and `api` subdomains are preferred.
- Access JWTs have a maximum 10-minute lifetime because immediate revocation applies primarily to refresh tokens; logout-all therefore has bounded eventual effect on already issued access tokens.
- Refresh-token rotation and reuse detection require durable session records.
- Google and GitHub account linking require verified ownership and cannot rely only on matching email text.
- Any future native or third-party API client requires a separately designed bearer-token flow.
