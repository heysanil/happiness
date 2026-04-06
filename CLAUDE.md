# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

Happiness is an open-source donation page platform built with Next.js 13 (App Router), Drizzle ORM, PlanetScale/MySQL, and Stripe. It powers customizable fundraiser pages with two page types: "simple" and "story".

## Commands

```bash
bun install              # Install dependencies
bun dev                  # Dev server (port from HP_DEV_PORT env, default 3000)
bun dev:db               # Dev server + Drizzle Studio (port 3100) concurrently
bun build                # Production build
bun lint                 # Biome lint + format check
bun lint:fix             # Biome lint + format auto-fix
bun format               # Biome format auto-fix
bun db:push              # Push Drizzle schema to MySQL database
bun db:gui               # Open Drizzle Studio on port 3100
```

## Architecture

### Route Groups (Next.js App Router)

The app uses two route groups under `src/app/`:

- **`(api)/`** — REST API and docs. All API routes live under `(api)/v1/` (pages, donations, donors, portal, external webhooks). OpenAPI spec is generated in `(api)/api/oas/index.ts` and served at `/api/openapi.json`. API docs use Stoplight Elements at `/api`.
- **`(frontend)/`** — Donation pages rendered server-side. Dynamic route `[pageID]/` resolves pages by slug via `getPage()` and renders either `SimplePage` or `StoryPage` based on `page.kind`.

### Database Layer

- **Schema**: `src/db/schema.ts` — Three entities: `pages`, `donations`, `donors`. Each has a corresponding `*_deleted` soft-delete table. All tables are prefixed with the configurable `databaseTablePrefix` (default: `happiness_`).
- **Init**: `src/db/init.ts` — PlanetScale serverless driver with Drizzle ORM.
- **Operations**: `src/db/ops/` — One file per operation (e.g., `getPage.ts`, `listDonations.ts`, `upsertDonor.ts`). Shared validation helpers in `ops/shared.ts`.
- **Zod schemas** are generated from Drizzle schemas via `drizzle-zod` and exported from `schema.ts` (e.g., `insertPageSchema`, `selectPageSchema`).

### API Conventions

- Each route has a `route.ts` colocated with a `schemas.ts` defining OpenAPI operation schemas.
- Auth: `src/app/(api)/v1/middleware/authorize.ts` — Bearer token auth against `HAPPINESS_ROOT_API_KEY` for `root` role; `public` role always passes.
- Responses: `HappinessResponse` class in `v1/responses/` provides standardized JSON responses. Errors go through `handleErrors.ts`.
- IDs: Generated via nanoid with type prefixes (`pg_`, `dn_`, `dr_`) — see `src/util/generateID.ts`.

### Stripe Integration

- `src/lib/stripe/` — Stripe client init, checkout session creation, portal URL generation, refund handling.
- Webhook handler at `src/app/(api)/v1/external/stripe/route.ts` processes `invoice.paid` and `charge.refunded` events.
- Optional Stripe Connect support via `STRIPE_ACCOUNT_ID` env var.

### Configuration

- `happiness.config.ts` — Central config (app name, logos, fiscal sponsor settings, platform fee). Most values are overridable via `NEXT_PUBLIC_*` env vars.
- `.env.example` — Required env vars: `HAPPINESS_ROOT_API_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`.

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

### Versioning & Releases

Uses Changesets for versioning. Conventional commits enforced via commitlint + Lefthook. Biome handles linting and formatting. GitHub Actions workflow creates release PRs on push to `main`.

### Runtime

Next.js nodejs runtime (not edge). Frontend pages use `revalidate = 60` for ISR with stale-while-revalidate caching.
