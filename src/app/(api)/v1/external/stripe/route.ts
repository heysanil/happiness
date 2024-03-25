import type { NextRequest } from 'next/server';
import { HappinessError } from 'src/util/HappinessError';
import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';
import { stripe } from '@lib/stripe';
import type Stripe from 'stripe';
import { z } from 'zod';
import { generateID, Prefixes } from 'src/util/generateID';
import { upsertDonation } from '@db/ops/donations/upsertDonation';

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!stripeWebhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET. Please add it to your environment.');

export const POST = async (request: NextRequest) => {
    try {
        const { headers } = request;

        const whSec = headers?.get('stripe-signature') || null;
        if (typeof whSec !== 'string') {
            return new HappinessError('Missing stripe-signature header', 400, { headers: Object.fromEntries(headers.entries()) });
        }

        const event = await stripe.webhooks.constructEventAsync(await request.text(), whSec, stripeWebhookSecret);

        switch (event.type) {
            // We always create invoices for donatinons, so we can rely on the invoice events
            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;

                // Validate the payment intent
                await z.string().startsWith('in_').parseAsync(invoice.id);

                // Validate the metadata to ensure it's Happiness-created and has the data we need
                const validateMetadata = await z
                    .object({
                        createdByHappiness: z.literal('true'),
                        pageID: z.string(),
                        donationID: z.string().optional(),
                        message: z.string().optional(),
                        visible: z.string().optional(),
                        tipAmount: z.string().optional(),
                    })
                    .passthrough()
                    .spa(
                        invoice.subscription
                            ? invoice.subscription_details?.metadata
                            : invoice.metadata,
                    );

                if (!validateMetadata.success) {
                    return new HappinessError('Invalid metadata; assuming this is not a Happiness transaction and ignoring', 202, { metadata: invoice.metadata });
                }

                const metadata = validateMetadata.data;

                // Generate a donation ID if one wasn't provided, otherwise validate the one provided
                const donationID = metadata.donationID || generateID(Prefixes.Donation);

                // Retrieve the payment intent and customer
                const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent as string, {
                    expand: ['customer', 'latest_charge.balance_transaction'],
                });
                const customer = pi.customer as Stripe.Customer;
                const charge = pi.latest_charge as Stripe.Charge;
                const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction;

                // Upsert donation
                const donation = await upsertDonation(
                    {
                        id: donationID,
                        pageID: metadata.pageID,
                        message: metadata.message,
                        visible: metadata.visible === 'true',
                        amount: (pi.amount_received - Number(metadata.tipAmount || 0)),
                        amountCurrency: pi.currency,
                        fee: balanceTx.fee,
                        feeCurrency: balanceTx.currency,
                        externalTransactionProvider: 'stripe',
                        externalTransactionID: pi.id,
                        tipAmount: Number(metadata.tipAmount || 0),
                    },
                    {
                        firstName: customer?.name?.split(' ')[0] || 'Anonymous',
                        lastName: customer?.name?.split(' ')[1] || 'Donor',
                        email: customer.email,
                        phone: customer.phone || null,
                        anonymous: metadata.visible === 'true',
                    },
                );

                return NextResponse.json(donation, { status: 201 });
            }
            default: {
                // Unexpected event type, log and ignore it
                console.warn(`Unhandled event type: ${event.type}`, { event });
                console.warn('Returning 204');
                return new NextResponse(null, { status: 204 });
            }
        }
    } catch (e) {
        return handleErrors(e);
    }
};
