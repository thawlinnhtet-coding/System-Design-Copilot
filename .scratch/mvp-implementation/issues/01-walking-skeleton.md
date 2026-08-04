# 01 - Walking Skeleton

**What to build:** A locally runnable frontend and backend connected through a versioned health contract, giving developers a verified foundation for all later User journeys.

**Blocked by:** None - can start immediately.

**Status:** completed

- [x] The frontend displays backend health through generated contract types.
- [x] Backend and frontend quality gates run from a clean checkout.
- [x] The public UI follows the Pencil, Tailwind CSS, and shadcn/ui direction.

## Verification

- `./mvnw.cmd verify` passed.
- `npm ci`, lint, typecheck, unit tests, build, and Playwright setup checks passed.
- `docker compose config` passed. The container image build is deferred because Docker Desktop was not running.
