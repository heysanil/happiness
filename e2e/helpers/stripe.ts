// ---------------------------------------------------------------------------
// Stripe test helpers for E2E webhook simulation
// ---------------------------------------------------------------------------

import Stripe from 'stripe';

const WEBHOOK_SECRET =
    process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_local_e2e_secret';

/**
 * Generates a signed Stripe webhook payload suitable for POSTing to the
 * application's webhook endpoint.
 */
export function generateWebhookPayload(eventType: string, data: object) {
    const payload = JSON.stringify({
        id: `evt_test_${Date.now()}`,
        object: 'event',
        type: eventType,
        data: { object: data },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-08-16',
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = Stripe.webhooks.generateTestHeaderString({
        payload,
        secret: WEBHOOK_SECRET,
        timestamp,
    });

    return { payload, signature };
}

/**
 * Returns a Stripe client configured for the test environment.
 */
export function getTestStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-08-16',
        stripeAccount: process.env.STRIPE_ACCOUNT_ID || undefined,
    });
}
