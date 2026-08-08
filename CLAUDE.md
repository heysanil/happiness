# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

Happiness is an open-source donation page platform built with Next.js 16 (App Router), React 19, Drizzle ORM, PlanetScale/MySQL, and Stripe. It powers customizable fundraiser pages with two page types: "simple" and "story".

## Commands

```bash
mise install             # Install pinned toolchain (Node, Bun, lefthook) + git hooks
bun install              # Install dependencies
bun dev                  # Dev server (port from HP_DEV_PORT env, default 3000)
bun dev:db               # Dev server + Drizzle Studio (port 3100) concurrently
bun build                # Production build
bun lint                 # Biome lint + format check
bun lint:fix             # Biome lint + format auto-fix
bun format               # Biome format auto-fix
bun typecheck            # TypeScript check (tsc --noEmit)
bun db:push              # Push Drizzle schema to MySQL database
bun db:gui               # Open Drizzle Studio on port 3100
bun test:e2e             # Run Playwright E2E tests (requires Docker services)
bun test:e2e:ui          # Run E2E tests with interactive Playwright UI
bun test:e2e:docker:up   # Start test Docker services (MySQL, Redis, MailPit)
bun test:e2e:docker:down # Stop and remove test Docker services
```

## Architecture

### Route Groups (Next.js App Router)

The app uses two route groups under `src/app/`:

- **`(api)/`** — REST API and docs. All API routes live under `(api)/v1/` (pages, donations, donors, portal, external webhooks). OpenAPI spec is generated in `(api)/api/oas/index.ts` and served at `/api/openapi.json`. API docs use Stoplight Elements at `/api`.
- **`(frontend)/`** — Donation pages rendered server-side. Dynamic route `[pageID]/` resolves pages by slug via `getPage()` and renders either `SimplePage` or `StoryPage` based on `page.kind`.

### Database Layer

- **Schema**: `src/db/schema.ts` — Three entities: `pages`, `donations`, `donors`. Each has a corresponding `*_deleted` soft-delete table. All tables are prefixed with the configurable `databaseTablePrefix` (`DATABASE_TABLE_PREFIX` env var, default `happiness`), joined to the table name with an underscore — e.g. `happiness_pages`.
- **Init**: `src/db/init.ts` — PlanetScale serverless driver with Drizzle ORM (default). Supports `DATABASE_DRIVER=mysql2` env var to switch to standard MySQL for local/test environments.
- **Operations**: `src/db/ops/` — Grouped into per-entity directories (`pages/`, `donations/`, `donors/`), one file per operation (e.g., `pages/getPage.ts`, `donations/listDonations.ts`, `donors/upsertDonor.ts`). Shared validation helpers in `ops/shared.ts`.
- **Zod schemas** are generated from Drizzle schemas via `drizzle-zod` and exported from `schema.ts` (e.g., `insertPageSchema`, `selectPageSchema`).

### API Conventions

- Each route has a `route.ts` colocated with a `schemas.ts` defining OpenAPI operation schemas.
- Auth: `src/app/(api)/v1/middleware/authorize.ts` — Bearer token auth against `HAPPINESS_ROOT_API_KEY` for `root` role; `public` role always passes.
- Responses: `HappinessResponse` class in `v1/responses/` provides standardized JSON responses. Errors go through `handleErrors.ts`.
- IDs: Generated via nanoid with type prefixes (`pg_`, `dn_`, `dr_`) — see `src/util/generateID.ts`.

### Stripe Integration

- `src/lib/stripe/` — Stripe client init, checkout session creation, portal URL generation, refund handling.
- Webhook handler at `src/app/(api)/v1/external/stripe/route.ts` processes `payment_intent.succeeded`, `invoice.paid`, and `charge.refunded` events.
- Optional Stripe Connect support via `STRIPE_ACCOUNT_ID` env var.

### Configuration

- `happiness.config.ts` — Central config (app name, logos, fiscal sponsor settings, platform fee). Most values are overridable via `NEXT_PUBLIC_*` env vars.
- `.env.example` — Core env vars: `HAPPINESS_ROOT_API_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. The donor portal additionally needs `BETTER_AUTH_SECRET`, `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, and the `SMTP_*` vars. Optional: `STRIPE_ACCOUNT_ID` / `NEXT_PUBLIC_STRIPE_ACCOUNT_ID` (Connect) and `HAPPINESS_INSTANCE_ID` (per-deployment webhook isolation).

### Path Aliases (tsconfig)

| Alias | Path |
|-------|------|
| `@v1/*` | `src/app/(api)/v1/*` |
| `@docs/*` | `src/app/(api)/api/*` |
| `@db/*` | `src/db/*` |
| `@frontend/*` | `src/app/(frontend)/*` |
| `@lib/*` | `src/lib/*` |
| `@public/*` | `public/*` |
| `paris/*` | `node_modules/paris/src/stories/*` |

### Styling

Tailwind CSS + SCSS modules. The `paris` UI library is used for typography and toast components. Fonts loaded from `slingshot.fm`.

### Toolchain

`mise.toml` pins exact versions of the runtimes and standalone binaries: Node 24.19.0, Bun 1.3.14, and lefthook 2.1.4. Everything else the project depends on — Biome, Playwright, drizzle-kit, commitlint — stays an npm dependency pinned by `bun.lock`, so each tool has exactly one source of truth. Don't duplicate an npm-managed tool into `mise.toml`.

lefthook carries a `postinstall` that runs `lefthook install`, so `mise install` is enough to get working git hooks on a fresh clone; it is skipped when `$CI` is set. If hooks silently don't fire, check for a stale `core.hooksPath` (`git config --unset core.hooksPath`).

CI installs the same toolchain via `jdx/mise-action@v4` instead of `setup-bun`/`setup-node`, so local and CI versions can't drift. All three workflows run on Namespace runners (`namespace-profile-default`); `docs-sentinel.yml` calls a reusable workflow, so it passes the label through the `runner` input rather than `runs-on`.

### Versioning & Releases

Uses Changesets for versioning. Conventional commits enforced via commitlint + Lefthook. Biome handles linting and formatting. GitHub Actions workflow creates release PRs on push to `main`.

### Authentication (Donor Portal)

- `src/lib/auth.ts` — Better Auth with email OTP plugin. Sessions stored as JWE cookies (7-day expiry). OTP codes stored in secondary storage (Upstash Redis in production, or ioredis via `AUTH_REDIS_DRIVER=ioredis` for tests).
- `src/lib/auth-client.ts` — Client-side Better Auth with `emailOTPClient` plugin.
- OTP emails sent via Nodemailer (SMTP config in env vars). Portal at `/portal` (login) and `/portal/dashboard` (authenticated).

### E2E Testing

88 Playwright tests across 17 spec files, organized into three tiers:

- **API tests** (`e2e/api/`) — 41 tests across 6 spec files covering Pages, Donations, Donors CRUD, request idempotency, donation presets, and Stripe webhook handling. Use Playwright's `request` context (no browser).
- **Frontend tests** (`e2e/frontend/`) — 44 tests across 8 spec files for the home page, simple and story donation pages, embed, presets, portal OTP login, donor dashboard, and receipt PDFs.
- **Flow tests** (`e2e/flows/`) — 3 end-to-end journeys across 3 spec files combining API + browser: one-time donation, recurring donation, and full donor portal flow.

**Infrastructure** (`docker-compose.test.yml`):
- MySQL 8.0 on port 3307 — test database with Drizzle schema push
- Redis 7 on port 6380 — Better Auth OTP/session storage
- MailPit on ports 1025 (SMTP) / 8025 (API) — captures OTP emails for test extraction

**Key files**:
- `playwright.config.ts` — config with webServer (`build && start`), global setup/teardown
- `e2e/global-setup.ts` — health checks Docker services, pushes schema, seeds test data
- `e2e/global-teardown.ts` — truncates tables, flushes Redis, clears mailbox
- `e2e/helpers/` — `api-client.ts` (typed API wrapper), `mailpit.ts` (OTP extraction), `stripe.ts` (webhook signing), `auth.ts` (automated OTP login), `fixtures.ts` (test constants)
- `.env.test.example` — template for test environment (copy to `.env.test` with real Stripe test keys)

**Driver toggles** (backward-compatible, production defaults unchanged):
- `DATABASE_DRIVER=mysql2` → uses `mysql2/promise` instead of `@planetscale/database`
- `AUTH_REDIS_DRIVER=ioredis` → uses `ioredis` instead of `@upstash/redis`

**CI**: `.github/workflows/e2e.yml` runs on PRs to main with MySQL/Redis/MailPit service containers and posts rich PR comments with test results. Requires GitHub secrets: `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_PUBLISHABLE_KEY`, `STRIPE_TEST_ACCOUNT_ID`.

### Runtime

Next.js nodejs runtime (not edge), set in both route-group layouts. Fundraiser pages (`[pageID]/page.tsx` and `[pageID]/embed/page.tsx`) combine `dynamic = 'force-static'` with `revalidate = 60` for ISR with stale-while-revalidate caching; the donor dashboard uses `dynamic = 'force-dynamic'`.
