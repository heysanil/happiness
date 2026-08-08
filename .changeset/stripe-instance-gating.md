---
"happiness": patch
---

Add an optional `HAPPINESS_INSTANCE_ID` env var to isolate deployments that share a Stripe (Connect) account. The instance ID is written into PaymentIntent and subscription metadata, and incoming webhook events belonging to another instance are acknowledged with a 200 and skipped instead of throwing "No such page found". Behavior is unchanged when the variable is unset.
