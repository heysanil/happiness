import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';
import { BASE_URL, SIMPLE_PAGE_ID } from '../helpers/fixtures';
import { generateWebhookPayload } from '../helpers/stripe';

test.describe('Stripe Webhook API', () => {
    test('POST /v1/external/stripe — invalid signature returns 400', async () => {
        const { payload } = generateWebhookPayload('payment_intent.succeeded', {
            id: 'pi_test_invalid_sig',
            metadata: { createdByHappiness: 'true' },
        });

        const res = await fetch(`${BASE_URL}/v1/external/stripe`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'stripe-signature': 't=9999999,v1=invalidsignature',
            },
            body: payload,
        });

        expect(res.status).toBe(400);
    });

    test('POST /v1/external/stripe — non-Happiness metadata returns 200 with ignore message', async () => {
        const { payload, signature } = generateWebhookPayload(
            'payment_intent.succeeded',
            {
                id: 'pi_test_non_happiness',
                metadata: {
                    someOtherApp: 'true',
                },
                invoice: null,
            },
        );

        const res = await fetch(`${BASE_URL}/v1/external/stripe`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'stripe-signature': signature,
            },
            body: payload,
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toContain('not created by Happiness');
    });

    test('POST /v1/external/stripe — unhandled event type returns 200 with not-handled message', async () => {
        const { payload, signature } = generateWebhookPayload(
            'customer.created',
            {
                id: 'cus_test_unhandled',
                email: 'unhandled@test.local',
            },
        );

        const res = await fetch(`${BASE_URL}/v1/external/stripe`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'stripe-signature': signature,
            },
            body: payload,
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toContain('not handled');
    });

    test('POST /v1/external/stripe — charge.refunded marks donation as refunded', async () => {
        const externalTxId = `pi_test_refund_${Date.now()}`;

        // First, create a donation with a known externalTransactionID
        const { status: createStatus } = await api.createDonation({
            donation: {
                pageID: SIMPLE_PAGE_ID,
                amount: 3000,
                visible: true,
                message: 'Refund test donation',
                externalTransactionProvider: 'stripe',
                externalTransactionID: externalTxId,
            },
            donor: {
                firstName: 'Refund',
                lastName: 'Test',
                email: 'refund-test@test.local',
            },
        });
        expect(createStatus).toBe(201);

        // Send a charge.refunded webhook event
        const { payload, signature } = generateWebhookPayload(
            'charge.refunded',
            {
                id: `ch_test_refund_${Date.now()}`,
                payment_intent: externalTxId,
                amount_refunded: 3000,
                currency: 'usd',
            },
        );

        const res = await fetch(`${BASE_URL}/v1/external/stripe`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'stripe-signature': signature,
            },
            body: payload,
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.refunded).toBe(externalTxId);
    });

    test('POST /v1/external/stripe — missing stripe-signature header returns 400', async () => {
        const res = await fetch(`${BASE_URL}/v1/external/stripe`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({ type: 'payment_intent.succeeded' }),
        });

        expect(res.status).toBe(400);
    });
});
