import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY || typeof process.env.STRIPE_SECRET_KEY !== 'string') {
    throw new Error('Missing Stripe secret key');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-08-16',
    maxNetworkRetries: 2,
    // This is only needed to run all Stripe requests through a Stripe Connect connected account. Leave the environment variable empty to use the default account for the provided Stripe secret key.
    stripeAccount: process.env.STRIPE_ACCOUNT_ID,
});
