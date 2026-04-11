import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';
import { BASE_URL, SIMPLE_PAGE_ID } from '../helpers/fixtures';
import { generateWebhookPayload } from '../helpers/stripe';

const makeIntentPayload = (overrides?: Record<string, unknown>) => ({
    amount: 2500,
    frequency: 'One-time' as const,
    coverFees: false,
    anonymous: false,
    projectName: 'Idempotency Test',
    pageID: SIMPLE_PAGE_ID,
    tipPercent: 0,
    email: `idemp-${Date.now()}@test.local`,
    donorName: 'Idempotency Test',
    ...overrides,
});

test.describe('Duplicate Payment Prevention', () => {
    test.describe('create-intent idempotency', () => {
        test('same idempotencyKey returns the same PaymentIntent', async () => {
            const idempotencyKey = crypto.randomUUID();
            const payload = makeIntentPayload({ idempotencyKey });

            const [res1, res2] = await Promise.all([
                api.createIntent(payload),
                api.createIntent(payload),
            ]);

            expect(res1.status).toBe(200);
            expect(res2.status).toBe(200);

            const data1 = res1.data as Record<string, unknown>;
            const data2 = res2.data as Record<string, unknown>;

            // Both calls must return the same clientSecret (same PaymentIntent)
            expect(data1.clientSecret).toBeTruthy();
            expect(data1.clientSecret).toBe(data2.clientSecret);

            // donationID should also be consistent (from PI metadata)
            expect(data1.donationID).toBeTruthy();
            expect(data1.donationID).toBe(data2.donationID);
        });

        test('different idempotencyKeys create different PaymentIntents', async () => {
            const base = makeIntentPayload();

            const res1 = await api.createIntent({
                ...base,
                idempotencyKey: crypto.randomUUID(),
            });
            const res2 = await api.createIntent({
                ...base,
                idempotencyKey: crypto.randomUUID(),
            });

            expect(res1.status).toBe(200);
            expect(res2.status).toBe(200);

            const data1 = res1.data as Record<string, unknown>;
            const data2 = res2.data as Record<string, unknown>;

            // Different keys → different PaymentIntents
            expect(data1.clientSecret).not.toBe(data2.clientSecret);
        });

        test('no idempotencyKey still works (backwards compatible)', async () => {
            const payload = makeIntentPayload();
            // Explicitly omit idempotencyKey
            delete (payload as Record<string, unknown>).idempotencyKey;

            const { status, data } = await api.createIntent(payload);
            const result = data as Record<string, unknown>;

            expect(status).toBe(200);
            expect(result.clientSecret).toBeTruthy();
            expect(result.donationID).toBeTruthy();
        });

        test('monthly subscription with same idempotencyKey returns same secret', async () => {
            const idempotencyKey = crypto.randomUUID();
            const payload = makeIntentPayload({
                frequency: 'Monthly',
                email: `idemp-monthly-${Date.now()}@test.local`,
                idempotencyKey,
            });

            const res1 = await api.createIntent(payload);
            expect(res1.status).toBe(200);

            const data1 = res1.data as Record<string, unknown>;
            expect(data1.clientSecret).toBeTruthy();

            // Second call with same key should return the same result
            const res2 = await api.createIntent(payload);
            expect(res2.status).toBe(200);

            const data2 = res2.data as Record<string, unknown>;
            expect(data2.clientSecret).toBe(data1.clientSecret);
        });
    });

    test.describe('webhook replay idempotency', () => {
        test('replaying payment_intent.succeeded creates only one donation', async () => {
            const donationID = `dn_idemptest${Date.now().toString(36)}`.slice(
                0,
                16,
            );
            const piID = `pi_test_replay_${Date.now()}`;

            // First, create a donation directly so the page exists and we have a baseline count
            const donationsBefore = await api.listDonations({
                page: SIMPLE_PAGE_ID,
            });
            const countBefore = (donationsBefore.data as unknown[]).length;

            // Create the webhook event
            const webhookData = {
                id: piID,
                amount_received: 2500,
                currency: 'usd',
                invoice: null,
                metadata: {
                    createdByHappiness: 'true',
                    pageID: SIMPLE_PAGE_ID,
                    donationID,
                    visible: 'true',
                    tipAmount: '0',
                    email: `replay-${Date.now()}@test.local`,
                    donorName: 'Replay Test',
                },
                latest_charge: {
                    balance_transaction: {
                        fee: 100,
                        currency: 'usd',
                    },
                    billing_details: {
                        email: `replay-${Date.now()}@test.local`,
                        name: 'Replay Test',
                    },
                },
                customer: null,
            };

            // Send the webhook twice (simulating Stripe retry)
            const { payload: p1, signature: s1 } = generateWebhookPayload(
                'payment_intent.succeeded',
                webhookData,
            );
            const { payload: p2, signature: s2 } = generateWebhookPayload(
                'payment_intent.succeeded',
                webhookData,
            );

            const res1 = await fetch(`${BASE_URL}/v1/external/stripe`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'stripe-signature': s1,
                },
                body: p1,
            });

            const res2 = await fetch(`${BASE_URL}/v1/external/stripe`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'stripe-signature': s2,
                },
                body: p2,
            });

            // Both should succeed (upsert is idempotent)
            expect(res1.status).toBe(201);
            expect(res2.status).toBe(201);

            // But only one donation should exist
            const donationsAfter = await api.listDonations({
                page: SIMPLE_PAGE_ID,
            });
            const countAfter = (donationsAfter.data as unknown[]).length;

            // Exactly one new donation, not two
            expect(countAfter).toBe(countBefore + 1);

            // Verify we can fetch the donation by ID and it's the right one
            const { status, data } = await api.getDonation(donationID);
            expect(status).toBe(200);
            expect((data as Record<string, unknown>).amount).toBe(2500);
        });

        test('charge.refunded replay is idempotent', async () => {
            const externalTxId = `pi_test_refund_idemp_${Date.now()}`;

            // Create a donation with a known externalTransactionID
            const { status: createStatus } = await api.createDonation({
                donation: {
                    pageID: SIMPLE_PAGE_ID,
                    amount: 4000,
                    visible: true,
                    message: 'Refund idempotency test',
                    externalTransactionProvider: 'stripe',
                    externalTransactionID: externalTxId,
                },
                donor: {
                    firstName: 'Refund',
                    lastName: 'Idemp',
                    email: `refund-idemp-${Date.now()}@test.local`,
                },
            });
            expect(createStatus).toBe(201);

            // Send refund webhook twice
            const chargeData = {
                id: `ch_test_refund_idemp_${Date.now()}`,
                payment_intent: externalTxId,
                amount_refunded: 4000,
                currency: 'usd',
            };

            const { payload: p1, signature: s1 } = generateWebhookPayload(
                'charge.refunded',
                chargeData,
            );
            const { payload: p2, signature: s2 } = generateWebhookPayload(
                'charge.refunded',
                chargeData,
            );

            const res1 = await fetch(`${BASE_URL}/v1/external/stripe`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'stripe-signature': s1,
                },
                body: p1,
            });
            const res2 = await fetch(`${BASE_URL}/v1/external/stripe`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'stripe-signature': s2,
                },
                body: p2,
            });

            expect(res1.status).toBe(200);
            expect(res2.status).toBe(200);

            // Both return the same refunded PI ID
            const body1 = await res1.json();
            const body2 = await res2.json();
            expect(body1.refunded).toBe(externalTxId);
            expect(body2.refunded).toBe(externalTxId);
        });
    });
});
