# happiness

## 0.2.0

### Minor Changes

- [`3cf0c9919da965eca340ca5bff7df4b14df3338c`](https://github.com/heysanil/happiness/commit/3cf0c9919da965eca340ca5bff7df4b14df3338c) Thanks [@heysanil](https://github.com/heysanil)! - Replace Stripe Checkout redirect with inline Payment Element and Express Checkout (Apple Pay, Google Pay, Link) in a paginated Drawer. Adds deferred PaymentIntent creation, a new `/v1/donations/create-intent` endpoint, `payment_intent.succeeded` webhook handler, donor email collection, and anonymous donor PII stripping.

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Customizable donation presets. Pages gain a `presets` JSON column (1–10 items, each with an `amount` plus optional `name` and `description`) exposed through the Zod schemas and OpenAPI spec. The donation drawer renders presets as a compact amount grid, or as a tier view with selectable cards when presets carry names or descriptions, with amounts formatted compactly (k/m/b) for large values.

- [#9](https://github.com/heysanil/happiness/pull/9) [`e07bd27ec1be4fdaa293c6dddfcbd4f083ea7492`](https://github.com/heysanil/happiness/commit/e07bd27ec1be4fdaa293c6dddfcbd4f083ea7492) Thanks [@heysanil](https://github.com/heysanil)! - Custom donor portal replacing Stripe's billing portal. Email OTP authentication via better-auth with stateless sessions and Upstash Redis storage. Dashboard with donation history, active subscription management, and PDF tax receipt generation with Graphik font. Async donation confirmation emails on successful payments with receipt links.

- [#10](https://github.com/heysanil/happiness/pull/10) [`d5c023c64115dc1e9032a96ce24c056f59b67e5b`](https://github.com/heysanil/happiness/commit/d5c023c64115dc1e9032a96ce24c056f59b67e5b) Thanks [@heysanil](https://github.com/heysanil)! - Add comprehensive E2E test suite with Playwright, Docker MySQL/Redis/MailPit, and GitHub Actions CI pipeline with PR comment reporting. Includes 56 tests covering all API routes, frontend pages, Stripe webhook handling, donor portal OTP flow, and full donation journeys.

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Fixed-dollar tip presets for small donations. Donations under $20 now offer $1/$3/$5 tip options instead of percentages, which stay as 5%/10%/15% at $20 and above. The tip mode switches automatically when the donation amount crosses the threshold.

- [`9b37dfa79cef2f1ed2bcd479b5749304f8082ed6`](https://github.com/heysanil/happiness/commit/9b37dfa79cef2f1ed2bcd479b5749304f8082ed6) Thanks [@heysanil](https://github.com/heysanil)! - Add page statuses

- [`40d05620af356fdd06648b8bb8a1abf8964f5be6`](https://github.com/heysanil/happiness/commit/40d05620af356fdd06648b8bb8a1abf8964f5be6) Thanks [@heysanil](https://github.com/heysanil)! - Simple donation pages

- [`daf61f0f17654a372a88ec1edca085608116ab78`](https://github.com/heysanil/happiness/commit/daf61f0f17654a372a88ec1edca085608116ab78) Thanks [@heysanil](https://github.com/heysanil)! - Add before/after timestamp filtering for listDonations API operation

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Rich markdown rendering for page content, powered by the Paris `Markdown` component. Replaces bare `ReactMarkdown` usage so every markdown element maps to a Paris component or themed element — GFM tables, strikethrough, task lists, code blocks, callout-style blockquotes, and accordion-style `details`.

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Add a `redactAnonymous` filter to `listDonations` and a matching query parameter on `GET /v1/donations`. When set alongside the donor relation, anonymous donors' first name, last name, company, email, and phone are selected through SQL `CASE` expressions that return `NULL`, so anonymous PII is never read out of the database. The donation row and the donor's `anonymous` flag are still returned, and default behavior is unchanged.

- [`9a9d00b3539f24dac6f20d327efbe87b48695929`](https://github.com/heysanil/happiness/commit/9a9d00b3539f24dac6f20d327efbe87b48695929) Thanks [@heysanil](https://github.com/heysanil)! - Add `/embed` path for donation pages that renders a simpler version of the page

- [`3617479f30f340b97405bb094251d42b57012dac`](https://github.com/heysanil/happiness/commit/3617479f30f340b97405bb094251d42b57012dac) Thanks [@heysanil](https://github.com/heysanil)! - Dynamic page banners, including automatically grabbing thumbnails from YouTube when the banner is a video embed

- [`4aeec7992dc3fbbb4361fbf1dc0004c3fc8d44f4`](https://github.com/heysanil/happiness/commit/4aeec7992dc3fbbb4361fbf1dc0004c3fc8d44f4) Thanks [@heysanil](https://github.com/heysanil)! - Upgrade to React 19, Next.js 16, Paris 0.17, and TypeScript 5.9

  - React 18 → 19, React DOM 18 → 19
  - Next.js 13 → 16 (with Turbopack as default bundler)
  - Paris 0.8 → 0.17 (migrated all color/token references to `new.*` namespace)
  - TypeScript 5.2 → 5.9, react-markdown 8 → 10
  - Migrated middleware.ts → proxy.ts (Next.js 16 convention)
  - Applied async params/headers codemods for Next.js 15+ compatibility
  - Configured Turbopack SVGR loader alongside existing webpack config
  - Regenerated public/paris.css from Paris 0.17 LightTheme via pte CLI
  - Fixed React 19 type breakages (JSX.IntrinsicElements, Buffer, Suspense)
  - Removed stale @headlessui/react override (Paris now uses v2)

### Patch Changes

- [`9713d55b9f3daf74547c6abc04bd94daab3ac440`](https://github.com/heysanil/happiness/commit/9713d55b9f3daf74547c6abc04bd94daab3ac440) Thanks [@heysanil](https://github.com/heysanil)! - Return 200 with descriptive messages for non-Happiness Stripe webhook events to prevent unnecessary retries

- [`2919b303eabf5fee55ba2d5122d5d1dc93b8fa1d`](https://github.com/heysanil/happiness/commit/2919b303eabf5fee55ba2d5122d5d1dc93b8fa1d) Thanks [@heysanil](https://github.com/heysanil)! - Upgrade to new Vercel speed insights library

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Actually enable 60-second ISR on fundraiser pages. `export const revalidate = 60` was inert without `generateStaticParams`, and static generation aborted with `DYNAMIC_SERVER_USAGE` because of the PlanetScale driver's `cache: 'no-store'` fetches. Adding `dynamic = 'force-static'` to the page and embed routes makes them serve from cache with 60-second stale-while-revalidate.

- [`fbf10a8ff61e3af759b6286803eb6a167435fa40`](https://github.com/heysanil/happiness/commit/fbf10a8ff61e3af759b6286803eb6a167435fa40) Thanks [@heysanil](https://github.com/heysanil)! - Switch from Edge to Node.js runtime for frontend and API layouts

- [`379ee2504693218c7d446cba61987e969924bdb2`](https://github.com/heysanil/happiness/commit/379ee2504693218c7d446cba61987e969924bdb2) Thanks [@heysanil](https://github.com/heysanil)! - Migrate from Husky/ESLint to Lefthook/Biome for git hooks and linting/formatting

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Correct the OpenAPI spec to match actual API inputs and outputs: add missing `organizerPicture`/`showRelatedPages` page fields and `tipAmount`/`refunded` donation fields, fix the donation schema description, exclude server-generated fields from required create/update properties, add the shared 404 error response, and document `include` relations on the donation and donor read operations.

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Return a 404 instead of a 500 for unknown page slugs. Page and embed lookups now route through a `getPageOrNotFound` helper that translates the 404 from `getPage` into Next's `notFound()`, rendering the not-found page with the correct status instead of hitting the error boundary.

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Prevent duplicate payments from double-submitted donations. The checkout form takes a synchronous ref-based submission lock, and a client-generated idempotency key is forwarded to every Stripe call made by `/v1/donations/create-intent`, so retried requests return the same PaymentIntent. Donation IDs are derived deterministically from the idempotency key so repeat calls use identical parameters, and replayed `payment_intent.succeeded`/`charge.refunded` webhooks are now idempotent.

- [#3](https://github.com/heysanil/happiness/pull/3) [`4308792a5c0f4ff569836b3fdd1124fd2a14613c`](https://github.com/heysanil/happiness/commit/4308792a5c0f4ff569836b3fdd1124fd2a14613c) Thanks [@saescapa](https://github.com/saescapa)! - Minor design styling updates

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Stop setting `receipt_email` on PaymentIntents so Stripe no longer sends its built-in receipt alongside the app's own confirmation email and PDF receipt, which sent donors duplicate emails

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Replace Stoplight Elements with Scalar for the API reference at `/api`, collapsing the client component, layout, and page into a single route handler. The docs page title now uses the configured app name.

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Render a single page-level donate drawer shared by every trigger. Story pages mount `PageSummary` twice (mobile summary and desktop sticky card) and each `DonateButton` carried its own Drawer and Stripe Elements tree, so `?open=donate` opened two stacked drawers. The drawer is now mounted once per page and opened through a `donateDrawerStore`, leaving `DonateButton` as a plain trigger.

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Add an optional `HAPPINESS_INSTANCE_ID` env var to isolate deployments that share a Stripe (Connect) account. The instance ID is written into PaymentIntent and subscription metadata, and incoming webhook events belonging to another instance are acknowledged with a 200 and skipped instead of throwing "No such page found". Behavior is unchanged when the variable is unset.

- [#5](https://github.com/heysanil/happiness/pull/5) [`867b7f7e898d356a5507159eee3d95a9d6760bad`](https://github.com/heysanil/happiness/commit/867b7f7e898d356a5507159eee3d95a9d6760bad) Thanks [@saescapa](https://github.com/saescapa)! - feat: Add database table prefix support

- [`ba0a8d1ff329ec934e58b78e70b100a60b86fca6`](https://github.com/heysanil/happiness/commit/ba0a8d1ff329ec934e58b78e70b100a60b86fca6) Thanks [@heysanil](https://github.com/heysanil)! - Add 60-second stale-while-revalidate caching for fundraiser pages

- [#15](https://github.com/heysanil/happiness/pull/15) [`6189f2e379ce91dc802a96163ae4e6f240a71d6b`](https://github.com/heysanil/happiness/commit/6189f2e379ce91dc802a96163ae4e6f240a71d6b) Thanks [@heysanil](https://github.com/heysanil)! - Upgrade Paris to v0.18.1, dropping the direct `remark-gfm` and `rehype-raw` dependencies now bundled by Paris

- [`a9027e3043cd4de58d482b9ed1862ae715b9b2ca`](https://github.com/heysanil/happiness/commit/a9027e3043cd4de58d482b9ed1862ae715b9b2ca) Thanks [@heysanil](https://github.com/heysanil)! - Fix issue where `raised` returns 1 when no funds have been raised

## 0.1.0

### Minor Changes

- [`0d1d35c`](https://github.com/heysanil/happiness/commit/0d1d35cab4e00c1541516ceb57112c1b6725def1) Thanks [@heysanil](https://github.com/heysanil)! - Stripe integration

- [`e1c93c2`](https://github.com/heysanil/happiness/commit/e1c93c267e00410ed1bd5935deb158a1cef42972) Thanks [@heysanil](https://github.com/heysanil)! - Initial backend, with support for pages, donors, and donations

- [`0d1d35c`](https://github.com/heysanil/happiness/commit/0d1d35cab4e00c1541516ceb57112c1b6725def1) Thanks [@heysanil](https://github.com/heysanil)! - Initial frontend (story pages)

### Patch Changes

- [`e1c93c2`](https://github.com/heysanil/happiness/commit/e1c93c267e00410ed1bd5935deb158a1cef42972) Thanks [@heysanil](https://github.com/heysanil)! - Devops setup (husky + commitlint, changesets, etc)

- [`e1c93c2`](https://github.com/heysanil/happiness/commit/e1c93c267e00410ed1bd5935deb158a1cef42972) Thanks [@heysanil](https://github.com/heysanil)! - Paris, `pte` setup
