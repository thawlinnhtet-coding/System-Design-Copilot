# 01 - Walking Skeleton

**What to build:** A locally runnable frontend and backend connected through a versioned health contract, giving developers a verified foundation for all later User journeys.

**Blocked by:** None - can start immediately.

**Status:** completed

- [x] The frontend displays backend health through generated contract types.
- [x] Backend and frontend quality gates run from a clean checkout.
- [x] The public UI follows the approved Markdown design contract, Tailwind CSS, and shadcn/ui direction.

## Verification

- `./mvnw.cmd verify` passed.
- `npm ci`, lint, typecheck, unit tests, build, and Playwright setup checks passed.
- `docker compose config` passed. The container image build is deferred because Docker Desktop was not running.

## Approved UI alignment

The approved `.pen` file and `DESIGN.md` are the implementation baseline for this foundation. Frontend work must use the approved product mark, graphite and warm-document tokens, responsive primitives, visible focus states, and shared loading/error/status patterns. These visual refinements are implemented through the UX-redesign tickets; they do not reopen the completed health-contract behavior.
