import { stripe } from '@lib/stripe';
import {
    computeTipAmount,
    DonationConfigSchema,
} from '@v1/donations/checkout/DonationConfig';
import { handleErrors } from '@v1/responses/handleErrors';
import { HappinessConfig } from 'happiness.config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generateID, Prefixes } from 'src/util/generateID';
import { HappinessError } from 'src/util/HappinessError';
import { z } from 'zod';

const CreateIntentSchema = DonationConfigSchema.extend({
    idempotencyKey: z.string().uuid().optional(),
});

export const POST = async (request: NextRequest): Promise<NextResponse> => {
    try {
        const body = await request.json();
        const validated = await CreateIntentSchema.parseAsync(body);

        const idempotencyKey = validated.idempotencyKey;
        const donationID = generateID(
            Prefixes.Donation,
            idempotencyKey ? `donation_${idempotencyKey}` : undefined,
        );
        const isRecurring = validated.frequency === 'Monthly';

        const tipAmount = computeTipAmount(
            validated.amount,
            validated.tipPercent,
            validated.tipFixed,
        );
        const totalAmount = validated.amount + tipAmount;

        const happinessInstance = process.env.HAPPINESS_INSTANCE_ID;

        const metadata = {
            createdByHappiness: 'true',
            pageID: validated.pageID,
            visible: `${!validated.anonymous}`,
            tipAmount: `${tipAmount}`,
            donationID,
            email: validated.email,
            donorName: validated.donorName || '',
            ...(happinessInstance ? { happinessInstance } : {}),
            ...(validated.message ? { message: validated.message } : {}),
        };

        const description = `Donation to ${validated.projectName}`;

        if (!isRecurring) {
            // One-time donation: create a PaymentIntent
            const stripeOptions = idempotencyKey
                ? { idempotencyKey: `pi_${idempotencyKey}` }
                : undefined;
            const paymentIntent = await stripe.paymentIntents.create(
                {
                    amount: totalAmount,
                    currency: 'usd',
                    metadata,
                    description,
                    automatic_payment_methods: { enabled: true },
                },
                stripeOptions,
            );

            if (!paymentIntent.client_secret) {
                throw new HappinessError(
                    'Failed to create payment intent',
                    500,
                );
            }

            // On idempotent replay, Stripe returns the original PI with its
            // metadata — use that donationID so client and webhook stay in sync.
            const effectiveDonationID =
                paymentIntent.metadata?.donationID || donationID;

            return NextResponse.json({
                clientSecret: paymentIntent.client_secret,
                donationID: effectiveDonationID,
            });
        }

        // Recurring donation: create Products, Customer, and Subscription
        // Subscription price_data requires product IDs (not inline product_data)
        const idemKey = (suffix: string) =>
            idempotencyKey
                ? { idempotencyKey: `${suffix}_${idempotencyKey}` }
                : undefined;

        const donationProduct = await stripe.products.create(
            { name: 'Donation', description },
            idemKey('prod'),
        );
        const tipProduct =
            tipAmount > 0
                ? await stripe.products.create(
                      {
                          name: 'Tip',
                          description: `Supporting ${HappinessConfig.name}`,
                      },
                      idemKey('tip_prod'),
                  )
                : null;

        const customer = await stripe.customers.create(
            {
                email: validated.email,
                name: validated.donorName || undefined,
                metadata: { createdByHappiness: 'true' },
            },
            idemKey('cus'),
        );

        const subscription = await stripe.subscriptions.create(
            {
                customer: customer.id,
                items: [
                    {
                        price_data: {
                            unit_amount: validated.amount,
                            currency: 'usd',
                            product: donationProduct.id,
                            recurring: { interval: 'month' },
                        },
                    },
                    ...(tipAmount > 0 && tipProduct
                        ? [
                              {
                                  price_data: {
                                      unit_amount: tipAmount,
                                      currency: 'usd',
                                      product: tipProduct.id,
                                      recurring: {
                                          interval: 'month' as const,
                                      },
                                  },
                              },
                          ]
                        : []),
                ],
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    save_default_payment_method: 'on_subscription',
                },
                metadata,
                expand: ['latest_invoice.payment_intent'],
            },
            idemKey('sub'),
        );

        const invoice = subscription.latest_invoice;
        if (!invoice || typeof invoice === 'string') {
            throw new HappinessError(
                'Failed to create subscription invoice',
                500,
            );
        }
        const pi = invoice.payment_intent;
        if (!pi || typeof pi === 'string' || !pi.client_secret) {
            throw new HappinessError(
                'Failed to create subscription payment intent',
                500,
            );
        }

        // On idempotent replay, read donationID from the subscription metadata
        const effectiveSubDonationID =
            subscription.metadata?.donationID || donationID;

        return NextResponse.json({
            clientSecret: pi.client_secret,
            donationID: effectiveSubDonationID,
        });
    } catch (e) {
        return handleErrors(e);
    }
};
