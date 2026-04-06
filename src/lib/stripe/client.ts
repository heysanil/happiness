import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID
        ? { stripeAccount: process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID }
        : undefined,
);
