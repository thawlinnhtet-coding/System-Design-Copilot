---
status: accepted
date: 2026-08-04
---

# Authorize The API With Clerk Session JWTs

The browser calls the separately hosted Spring Boot API with a short-lived Clerk session JWT in the `Authorization` header. Spring Boot validates the token's signature, issuer, audience, authorized party, expiry, and subject, then applies all product authorization and policy; it never trusts client-supplied ownership or Entitlement claims.

## Considered Options

- Keep application-owned Secure HttpOnly access and refresh cookies.
- Proxy all browser API traffic through Next.js to preserve same-origin Clerk cookies.
- Send a Clerk session JWT directly to the API.

The existing application-owned session model conflicts with Clerk-managed identity. A Next.js proxy would hide the token from browser JavaScript but adds an extra runtime hop and a second request boundary without reducing Spring Boot's policy work. Direct, short-lived Clerk JWTs are Clerk's standard cross-origin integration and best meet the MVP's low-operations goal.

## Consequences

- The previous backend cookie, refresh-token, and CSRF session contract is superseded.
- The frontend obtains a short-lived API token only when making a request and does not persist it in browser storage.
- The frontend must use a strict Content Security Policy and other XSS protections because a running script can request an API token.
- CORS permits only configured frontend origins and the API rejects missing, invalid, expired, wrongly issued, or wrongly authorized tokens.
- Clerk session revocation prevents new tokens; API tokens expire within 10 minutes, bounding the effect of a previously issued token.
