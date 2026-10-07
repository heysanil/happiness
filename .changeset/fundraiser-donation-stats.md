---
'happiness': minor
---

Add `GET /v1/donations/stats`, which aggregates donation totals across a set of pages and returns both combined totals and a per-page breakdown. `totals.donorCount` is a distinct count over the whole set, so a donor who gave to several of the requested pages is counted once. Refunded donations are excluded and amounts cover the donation amount only, matching the `raised` value returned by `GET /v1/pages/{id}`.

`GET /v1/pages` now accepts an `ids` query parameter to restrict results to a comma-separated set of page IDs, so consumers can fetch a known set of pages in one request instead of one request per page.

Index `donations` on `(page_id, created_at)` and `donor_id`. Donation aggregates scope by page and then window by date, so both the all-time and since-date figures are served by the composite index; previously these queries scanned the table.

Mark the `name` and `description` fields of a page's donation `presets` as nullable in the OpenAPI schema, matching the backend, which has always accepted null for both.
