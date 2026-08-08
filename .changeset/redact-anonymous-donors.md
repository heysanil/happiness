---
"happiness": minor
---

Add a `redactAnonymous` filter to `listDonations` and a matching query parameter on `GET /v1/donations`. When set alongside the donor relation, anonymous donors' first name, last name, company, email, and phone are selected through SQL `CASE` expressions that return `NULL`, so anonymous PII is never read out of the database. The donation row and the donor's `anonymous` flag are still returned, and default behavior is unchanged.
