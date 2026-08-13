# 02 - Clerk Identity Boundary

**What to build:** Clerk-managed authentication for the Free beta, with durable User association and a Spring API boundary that accepts only valid Clerk JWTs.

**Blocked by:** 01 - Walking Skeleton.

**Status:** completed

- [x] A User can register, sign in, restore a managed session, and sign out through Clerk.
- [x] The API validates Clerk issuer, audience, authorized party, expiry, signature, and subject.
- [x] Invalid tokens and cross-User access are rejected through observable API behavior.

## Approved UI alignment

The Clerk-hosted routes must implement the approved branded authentication journey on desktop and mobile:

- email and password sign-in and registration;
- Google and GitHub alternatives;
- preserved selected-Challenge or intended-destination context;
- email verification, resend, password-reset request, reset completion, and generic retry states;
- inline credential validation without revealing whether an email address is registered; and
- a full-page **Authentication temporarily unavailable** state only for retryable network or identity-service failures. It preserves the email and password fields, destination, and a retry action.

Clerk remains responsible for credentials, verification, recovery, and sessions. The product must not receive or store passwords.
