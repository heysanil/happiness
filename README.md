# happiness

`happiness` is an open-source donation page platform. It was initially built to power donation pages for [Slingshot Giving](https://slingshot.giving) and [Hack+](https://hackplus.io).

## Getting Started

`happiness` is currently built to run on Vercel's Edge Runtime using PlanetScale's serverless driver. Other MySQL databases should work by adjusting the Drizzle configuration to use `mysql2` instead of the PlanetScale driver, but are currently untested.

To get started, create a clone of this repository:

```bash
git clone --mirror https://github.com/heysanil/happiness
# or, click "Use this template" on GitHub
```

Install dependencies using `pnpm`:
```bash
pnpm install
```

Copy `.env.example` to `.env.local` and set the required environmental variables. As of now, you'll need to sign up for Stripe (for payment processing). If you want Happiness to fire webhooks, you can optionally add a Zeplo queue for more reliable and asynchronous queueing.

You can also directly modify the configuration in `happiness.config.ts` and replace icons/logos in `public`.

Push the database schema to your database:

```bash
pnpm db:push
```

This will create the required tables with a `happiness_` prefix, so you can use an existing database (all future schema pushes will also be scoped to `happiness_`-prefixed tables).

Then, run the development server using `pnpm dev` (or the production server using `pnpm start`).

You can also open a Drizzle Studio UI using `pnpm db:gui`, or run both the development server and Drizzle Studio UI using `pnpm dev:db`. Drizzle Studio runs on port 3100 by default, but this behavior can be changed in `package.json`.

**NOTE: To complete setup, you also need to set up the correct webhooks on the Stripe Dashboard.** Using a service like Zeplo as a proxy to forward webhooks to your app is recommended, which will give you more control over logging and retries, but you can also point Stripe directly to the `/v1/external/stripe` endpoint.

## API

Happiness exposes a REST API for managing pages, donations, and donors. The API documentation can be found at `/api` when running the server, and a JSON OpenAPI spec can be downloaded at `/api/openapi.json`.

## Using a non-MySQL database

For now, there are two main ways to use a non-MySQL database with Happiness:

1. Update the Drizzle schema & configuration to use a different database driver. You will need to manually update each `XXColumns` definition to use the correct Drizzle `core` types.
2. Update the operations functions in `src/db/ops`. You will need to manually rewrite each function to adapt to your database. This will essentially disable the Drizzle ORM, but will allow you to use any database (including NoSQL databases). You should still use the types and Zod schemas exported from the Drizzle schema and ensure all functions maintain the same return formats.

You only need to do one of these; if you update the Drizzle schema & configuration, you can leave the operations functions as-is, and vice versa.

If you proceed with either of these routes, we ask that you open-source your work so that others can benefit from it. We are also open to accepting pull requests that add support for other databases, as well as promoting community-maintained forks that adapt Happiness to other databases.

## Basic structure

Any number of `Pages` can be set up, which are either a simple donation page or a 'story' style page with more customization.

Every `Donation` is linked to both a `Page` and a `Donor`.

Donors begin their donation on the page. Upon selecting their amount and preferences, they are redirected to a Stripe Checkout page to complete their donation. Once the donation is complete, they are redirected back to the page. Donations are only recorded to the database after payments are successfully processed and the donor is redirected back to the page.

Recurring donations are handled fully through Stripe; incoming donation webhooks are used to update the database.

## Development

### API

All API routes currently exist under [`src/app/(api)/v1`](./src/app/(api)/v1).

Each route is defined in a directory's `route.ts` file. Every `route.ts` should be colocated with a `schemas.ts` file that defines the OpenAPI schemas for each operation in the route.

The OpenAPI spec is generated in [`src/app/(api)/api/oas/index.ts`](./src/app/(api)/api/oas/index.ts). Components can be defined there, and then shared across paths via `$ref`.

The API docs are generated using Stoplight Elements, and live in [src/app/(api)/api](./src/app/(api)/api).

## Coming soon

- [ ] Administrator portal and dashboard
  - [ ] Stripe Connect + multi-tenancy
- [ ] API key management
- [ ] Updater for smooth upgrades instead of relying on Git cloning
