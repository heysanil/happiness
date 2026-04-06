import { stripe } from '@lib/stripe';

/**
 * Refunds a Stripe payment intent in full.
 * @param paymentIntentID - The Stripe payment intent ID to refund.
 * @returns The created Stripe refund object.
 */
export const refundPaymentIntent = async (paymentIntentID: string) =>
    stripe.refunds.create({
        payment_intent: paymentIntentID,
    });
