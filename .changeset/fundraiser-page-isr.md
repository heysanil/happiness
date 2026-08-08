---
"happiness": patch
---

Actually enable 60-second ISR on fundraiser pages. `export const revalidate = 60` was inert without `generateStaticParams`, and static generation aborted with `DYNAMIC_SERVER_USAGE` because of the PlanetScale driver's `cache: 'no-store'` fetches. Adding `dynamic = 'force-static'` to the page and embed routes makes them serve from cache with 60-second stale-while-revalidate.
