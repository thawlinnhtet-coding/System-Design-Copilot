# Clerk Configuration

Configure the Clerk instance before running this application outside the isolated test suite.

1. Restrict sign-up to invitations for the personal beta. Do not create product-managed invitation records or APIs.
2. Enable email/password, Google, and GitHub sign-in in Clerk.
3. Create the `system-design-copilot-api` JWT template with audience `system-design-copilot-api` and a maximum lifetime of 10 minutes.
4. Configure the production authorized party to the canonical frontend origin, and set the same origin in `CLERK_AUTHORIZED_PARTY` and `APP_CORS_ALLOWED_ORIGINS`.
5. Set Clerk's allowed redirect and origin lists to the canonical frontend URL. For local development, use `http://localhost:3000`.
6. Copy the Clerk issuer and JWKS URL into the backend environment. Copy the publishable key and frontend API URL into the frontend environment. Do not place Clerk secret keys in the frontend.

The required variable names and inert placeholders are listed in `backend/.env.example` and `frontend/web/.env.example`.
