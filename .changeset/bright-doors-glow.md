---
"happiness": minor
---

Replace Stripe Checkout redirect with inline Payment Element and Express Checkout (Apple Pay, Google Pay, Link) in a paginated Drawer. Adds deferred PaymentIntent creation, a new `/v1/donations/create-intent` endpoint, `payment_intent.succeeded` webhook handler, donor email collection, and anonymous donor PII stripping.
