import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleErrors } from '@v1/responses/handleErrors';
import { stripe } from '@lib/stripe';
import { DonationConfigSchema } from '@v1/donations/checkout/DonationConfig';
import { HappinessConfig } from 'happiness.config';
import { generateID, Prefixes } from 'src/util/generateID';
import { HappinessError } from 'src/util/HappinessError';

export const POST = async (request: NextRequest): Promise<NextResponse> => {
    try {
        const body = await request.json();
        const validated = await DonationConfigSchema.parseAsync(body);

        const donationID = generateID(Prefixes.Donation);
        const isRecurring = validated.frequency === 'Monthly';

        const tipAmount = Math.round(validated.tipPercent * validated.amount);
        const totalAmount = validated.amount + tipAmount;

        const metadata = {
            createdByHappiness: 'true',
            pageID: validated.pageID,
            visible: `${!validated.anonymous}`,
            tipAmount: `${tipAmount}`,
            donationID,
            ...validated.message ? { message: validated.message } : {},
        };

        const description = `Donation to ${validated.projectName}`;

        if (!isRecurring) {
            // One-time donation: create a PaymentIntent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalAmount,
                currency: 'usd',
                metadata,
                description,
                automatic_payment_methods: { enabled: true },
            });

            if (!paymentIntent.client_secret) {
                throw new HappinessError('Failed to create payment intent', 500);
            }

            return NextResponse.json({
                clientSecret: paymentIntent.client_secret,
                donationID,
            });
        }

        // Recurring donation: create Products, Customer, and Subscription
        // Subscription price_data requires product IDs (not inline product_data)
        const donationProduct = await stripe.products.create({ name: 'Donation', description });
        const tipProduct = tipAmount > 0
            ? await stripe.products.create({ name: 'Tip', description: `Supporting ${HappinessConfig.name}` })
            : null;

        const customer = await stripe.customers.create({
            metadata: { createdByHappiness: 'true' },
        });

        const subscription = await stripe.subscriptions.create({
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
                ...(tipAmount > 0 && tipProduct ? [{
                    price_data: {
                        unit_amount: tipAmount,
                        currency: 'usd',
                        product: tipProduct.id,
                        recurring: { interval: 'month' as const },
                    },
                }] : []),
            ],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
            },
            metadata,
            expand: ['latest_invoice.payment_intent'],
        });

        const invoice = subscription.latest_invoice;
        if (!invoice || typeof invoice === 'string') {
            throw new HappinessError('Failed to create subscription invoice', 500);
        }
        const pi = invoice.payment_intent;
        if (!pi || typeof pi === 'string' || !pi.client_secret) {
            throw new HappinessError('Failed to create subscription payment intent', 500);
        }

        return NextResponse.json({
            clientSecret: pi.client_secret,
            donationID,
        });
    } catch (e) {
        return handleErrors(e);
    }
};
