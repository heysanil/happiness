import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';
import { BASE_URL, SIMPLE_PAGE_ID } from '../helpers/fixtures';
import { clearMailbox, getLatestEmail } from '../helpers/mailpit';
import { generateWebhookPayload, getTestStripe } from '../helpers/stripe';

test.describe('One-Time Donation Flow', () => {
    test.setTimeout(120_000);

    test('complete one-time donation flow', async ({ request }) => {
        const stripe = getTestStripe();
        const testEmail = `onetime-${Date.now()}@test.local`;

        // Step 1: Create a payment intent via the API
        const { status: intentStatus, data: intentData } =
            await api.createIntent({
                amount: 2500,
                frequency: 'One-time',
                coverFees: false,
                anonymous: false,
                projectName: 'E2E Test Simple',
                pageID: SIMPLE_PAGE_ID,
                tipPercent: 0,
                email: testEmail,
                donorName: 'One Time Donor',
            });

        expect(intentStatus).toBe(200);
        const intent = intentData as {
            clientSecret: string;
            donationID: string;
        };
        expect(intent.clientSecret).toBeTruthy();
        expect(intent.donationID).toBeTruthy();

        // Step 2: Extract PI ID from client secret (format: pi_xxx_secret_yyy)
        const piId = intent.clientSecret.split('_secret_')[0];
        expect(piId).toMatch(/^pi_/);

        // Step 3: Confirm the payment intent via Stripe SDK
        const confirmedPI = await stripe.paymentIntents.confirm(piId, {
            payment_method: 'pm_card_visa',
        });
        expect(confirmedPI.status).toBe('succeeded');

        // Step 4: Clear mailbox before sending webhook so we only catch the confirmation email
        await clearMailbox();

        // Step 5: Send synthetic payment_intent.succeeded webhook
        // The webhook handler calls stripe.paymentIntents.retrieve() on the real PI,
        // so we just need enough fields for initial validation. The real data comes
        // from the Stripe API retrieve call.
        const { payload, signature } = generateWebhookPayload(
            'payment_intent.succeeded',
            {
                id: piId,
                object: 'payment_intent',
                amount: 2500,
                amount_received: 2500,
                currency: 'usd',
                status: 'succeeded',
                invoice: null,
                metadata: {
                    createdByHappiness: 'true',
                    pageID: SIMPLE_PAGE_ID,
                    donationID: intent.donationID,
                    email: testEmail,
                    donorName: 'One Time Donor',
                    visible: 'true',
                    tipAmount: '0',
                },
            },
        );

        const webhookRes = await request.post(
            `${BASE_URL}/v1/external/stripe`,
            {
                data: payload,
                headers: {
                    'content-type': 'application/json',
                    'stripe-signature': signature,
                },
            },
        );
        expect(webhookRes.status()).toBe(201);

        // Step 6: Verify donation exists in the database
        const { status: donationStatus, data: donationData } =
            await api.getDonation(intent.donationID);
        expect(donationStatus).toBe(200);

        const donation = donationData as Record<string, unknown>;
        expect(donation.amount).toBe(2500);
        expect(donation.visible).toBe(true);
        expect(donation.externalTransactionProvider).toBe('stripe');
        expect(donation.externalTransactionID).toBe(piId);

        // Step 7: Verify confirmation email was sent via MailPit
        const email = await getLatestEmail(testEmail);
        expect(email.subject).toBeTruthy();
        expect(email.text.length + email.html.length).toBeGreaterThan(0);
    });
});
