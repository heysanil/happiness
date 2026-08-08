---
"happiness": patch
---

Prevent duplicate payments from double-submitted donations. The checkout form takes a synchronous ref-based submission lock, and a client-generated idempotency key is forwarded to every Stripe call made by `/v1/donations/create-intent`, so retried requests return the same PaymentIntent. Donation IDs are derived deterministically from the idempotency key so repeat calls use identical parameters, and replayed `payment_intent.succeeded`/`charge.refunded` webhooks are now idempotent.
