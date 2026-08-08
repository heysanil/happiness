---
"happiness": patch
---

Render a single page-level donate drawer shared by every trigger. Story pages mount `PageSummary` twice (mobile summary and desktop sticky card) and each `DonateButton` carried its own Drawer and Stripe Elements tree, so `?open=donate` opened two stacked drawers. The drawer is now mounted once per page and opened through a `donateDrawerStore`, leaving `DonateButton` as a plain trigger.
