import type { NextRequest } from 'next/server';
import { HappinessError } from 'src/util/HappinessError';
import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';
import { stripe } from '@lib/stripe';
import type Stripe from 'stripe';
import { z } from 'zod';
import { generateID, Prefixes } from 'src/util/generateID';
import { upsertDonation } from '@db/ops/donations/upsertDonation';
import { db } from '@db/init';
import { donations } from '@db/schema';
import { eq } from 'drizzle-orm';

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!stripeWebhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET. Please add it to your environment.');

export const POST = async (request: NextRequest): Promise<NextResponse> => {
    try {
        const { headers } = request;

        const whSec = headers?.get('stripe-signature') || null;
        if (typeof whSec !== 'string') {
            throw new HappinessError('Missing stripe-signature header', 400, { headers: Object.fromEntries(headers.entries()) });
        }

        const event = await stripe.webhooks.constructEventAsync(await request.text(), whSec, stripeWebhookSecret);

        switch (event.type) {
            // One-time donations via inline Payment Element create PaymentIntents directly
            case 'payment_intent.succeeded': {
                const pi = event.data.object as Stripe.PaymentIntent;

                // Skip subscription-originated PIs — they're handled by invoice.paid
                if (pi.invoice) {
                    return NextResponse.json(
                        { status: 200, message: 'Ignored: subscription-originated PaymentIntent; handled by invoice.paid' },
                        { status: 200 },
                    );
                }

                // Validate the metadata to ensure it's Happiness-created
                const validatePiMetadata = await z
                    .object({
                        createdByHappiness: z.literal('true'),
                        pageID: z.string(),
                        donationID: z.string(),
                        message: z.string().optional(),
                        visible: z.string().optional(),
                        tipAmount: z.string().optional(),
                        email: z.string().optional(),
                        donorName: z.string().optional(),
                    })
                    .passthrough()
                    .spa(pi.metadata);

                if (!validatePiMetadata.success) {
                    // Not a Happiness transaction — acknowledge and ignore
                    return NextResponse.json(
                        { status: 200, message: 'Ignored: PaymentIntent not created by Happiness' },
                        { status: 200 },
                    );
                }

                const piMeta = validatePiMetadata.data;

                // Retrieve the charge with balance transaction for fee info
                const piExpanded = await stripe.paymentIntents.retrieve(pi.id, {
                    expand: ['latest_charge.balance_transaction', 'customer'],
                });
                const customer = piExpanded.customer as Stripe.Customer | null;
                const charge = piExpanded.latest_charge as Stripe.Charge;
                const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction;

                if (customer?.email) {
                    await stripe.paymentIntents.update(pi.id, {
                        receipt_email: customer.email,
                    }).catch((e) => {
                        console.error('Failed to update payment intent receipt email:', e);
                    });
                }

                const donorEmail = piMeta.email
                    || charge.billing_details?.email
                    || customer?.email
                    || `${piMeta.donationID}@donor.noemail`;

                const donorFullName = piMeta.donorName
                    || charge.billing_details?.name
                    || customer?.name
                    || '';
                const [donorFirst, ...donorLastParts] = donorFullName.split(' ');

                const piDonation = await upsertDonation(
                    {
                        id: piMeta.donationID,
                        pageID: piMeta.pageID,
                        message: piMeta.message,
                        visible: piMeta.visible === 'true',
                        amount: (piExpanded.amount_received - Number(piMeta.tipAmount || 0)),
                        amountCurrency: piExpanded.currency,
                        fee: balanceTx.fee,
                        feeCurrency: balanceTx.currency,
                        externalTransactionProvider: 'stripe',
                        externalTransactionID: piExpanded.id,
                        tipAmount: Number(piMeta.tipAmount || 0),
                    },
                    {
                        firstName: donorFirst || 'Anonymous',
                        lastName: donorLastParts.join(' ') || 'Donor',
                        email: donorEmail,
                        phone: customer?.phone || null,
                        anonymous: piMeta.visible !== 'true',
                    },
                );

                return NextResponse.json(piDonation, { status: 201 });
            }

            // Subscriptions (monthly donations) still use invoice events
            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;

                // Validate the invoice ID format
                if (!invoice.id?.startsWith('in_')) {
                    return NextResponse.json(
                        { status: 200, message: 'Ignored: invoice ID does not match expected format' },
                        { status: 200 },
                    );
                }

                // Validate the metadata to ensure it's Happiness-created and has the data we need
                const validateMetadata = await z
                    .object({
                        createdByHappiness: z.literal('true'),
                        pageID: z.string(),
                        donationID: z.string().optional(),
                        message: z.string().optional(),
                        visible: z.string().optional(),
                        tipAmount: z.string().optional(),
                        email: z.string().optional(),
                        donorName: z.string().optional(),
                    })
                    .passthrough()
                    .spa(
                        invoice.subscription
                            ? invoice.subscription_details?.metadata
                            : invoice.metadata,
                    );

                if (!validateMetadata.success) {
                    return NextResponse.json(
                        { status: 200, message: 'Ignored: invoice metadata does not match Happiness format; not a Happiness transaction' },
                        { status: 200 },
                    );
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

                if (customer.email) {
                    // Add customer email as receipt_email for payment intent
                    await stripe.paymentIntents.update(pi.id, {
                        receipt_email: customer.email,
                    })
                        .catch((e) => {
                            console.error('Failed to update payment intent receipt email:', e);
                        });
                }

                const invoiceDonorEmail = metadata.email
                    || customer?.email
                    || charge.billing_details?.email
                    || `${donationID}@donor.noemail`;

                const invoiceDonorName = metadata.donorName
                    || charge.billing_details?.name
                    || customer?.name
                    || '';
                const [invFirst, ...invLastParts] = invoiceDonorName.split(' ');

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
                        firstName: invFirst || 'Anonymous',
                        lastName: invLastParts.join(' ') || 'Donor',
                        email: invoiceDonorEmail,
                        phone: customer?.phone || null,
                        anonymous: metadata.visible !== 'true',
                    },
                );

                return NextResponse.json(donation, { status: 201 });
            }
            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge;
                const paymentIntentID = typeof charge.payment_intent === 'string'
                    ? charge.payment_intent
                    : charge.payment_intent?.id;

                if (!paymentIntentID) {
                    throw new HappinessError('Refund event missing payment_intent', 400, { charge: charge.id });
                }

                // Mark the donation as refunded by its external transaction ID
                const result = await db.update(donations)
                    .set({ refunded: true })
                    .where(eq(donations.externalTransactionID, paymentIntentID));

                return NextResponse.json({ refunded: paymentIntentID }, { status: 200 });
            }
            default: {
                console.warn(`Unhandled Stripe event type: ${event.type}`);
                return NextResponse.json(
                    { status: 200, message: `Ignored: event type '${event.type}' is not handled` },
                    { status: 200 },
                );
            }
        }
    } catch (e) {
        return handleErrors(e);
    }
};
