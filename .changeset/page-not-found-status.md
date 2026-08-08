---
"happiness": patch
---

Return a 404 instead of a 500 for unknown page slugs. Page and embed lookups now route through a `getPageOrNotFound` helper that translates the 404 from `getPage` into Next's `notFound()`, rendering the not-found page with the correct status instead of hitting the error boundary.
