---
"happiness": minor
---

Customizable donation presets. Pages gain a `presets` JSON column (1–10 items, each with an `amount` plus optional `name` and `description`) exposed through the Zod schemas and OpenAPI spec. The donation drawer renders presets as a compact amount grid, or as a tier view with selectable cards when presets carry names or descriptions, with amounts formatted compactly (k/m/b) for large values.
