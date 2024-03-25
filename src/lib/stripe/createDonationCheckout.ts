import { stripe } from '@lib/stripe/index';
import type { DonationConfig } from '@v1/donations/checkout/DonationConfig';
import { HappinessConfig } from 'happiness.config';
import { HappinessError } from 'src/util/HappinessError';
import { DonationConfigSchema } from '@v1/donations/checkout/DonationConfig';

/**
 * Creates a Stripe Checkout session for a donation. Returns the URL for the checkout.
 * @param body - The configuration for the donation.
 * @param donationID - A generated ID for reconciling this donation.
 * @param successURL - The URL to redirect to upon a successful callback.
 * @param cancelURL - The URL to redirect to upon a cancelled checkout.
 */
export const createDonationCheckout = async (
    body: unknown,
    donationID: string,
    successURL: string,
    cancelURL: string,
): Promise<string> => {
    const config = body as Record<string, string>;
    const validated = await DonationConfigSchema.parseAsync({
        amount: Number(config.amount),
        frequency: config.frequency,
        message: config.message,
        coverFees: config.coverFees.toLowerCase() === 'true',
        anonymous: config.anonymous.toLowerCase() === 'true',
        projectName: config.projectName,
        pageID: config.pageID,
        tipPercent: Number(config.tipPercent),
    });

    const isRecurring = validated.frequency === 'Monthly';

    // Add session_id search param to successURL
    const { search } = new URL(successURL);
    const successURLWithSessionID = search
        ? `${successURL}&session_id={CHECKOUT_SESSION_ID}`
        : `${successURL}?session_id={CHECKOUT_SESSION_ID}`;

    const metadata = {
        createdByHappiness: 'true',
        pageID: validated.pageID,
        visible: `${!validated.anonymous}`,
        tipAmount: `${Math.round(validated.tipPercent * validated.amount)}`,
        ...validated.message ? { message: validated.message } : {},
    };

    // Create the checkout session
    const checkout = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    unit_amount: validated.amount,
                    currency: 'usd',
                    product_data: {
                        name: 'Donation',
                        description: `Donation to ${validated.projectName}`,
                    },
                    ...(isRecurring ? { recurring: { interval: 'month' } } : {}),
                },
                quantity: 1,
            },
            {
                price_data: {
                    unit_amount: Math.round(validated.tipPercent * validated.amount),
                    currency: 'usd',
                    product_data: {
                        name: 'Tip',
                        description: `Supporting ${HappinessConfig.name}`,
                    },
                    ...(isRecurring ? { recurring: { interval: 'month' } } : {}),
                },
                quantity: 1,
            },
        ],
        mode: !isRecurring ? 'payment' : 'subscription',
        success_url: successURLWithSessionID.toString(),
        cancel_url: cancelURL,
        client_reference_id: donationID,
        ...!isRecurring ? {
            invoice_creation: {
                enabled: true,
                invoice_data: {
                    description: `Donation to ${validated.projectName}`,
                    custom_fields: [{ name: 'EIN', value: HappinessConfig.fiscalSponsorEIN }],
                    footer: HappinessConfig.fiscalSponsorMode
                        ? `${validated.projectName} is a fiscally-sponsored nonprofit project of ${HappinessConfig.fiscalSponsorName}, a 501(c)(3) public charity. Your donation is tax-deductible to the extent allowed by law.`
                        : `Your donation is processed by ${HappinessConfig.name}, the platform that ${validated.projectName} is using to raise money.`,
                    metadata: {
                        ...metadata,
                        donationID,
                    },
                },
            },
            submit_type: 'donate',
            payment_intent_data: {
                metadata: {
                    ...metadata,
                    donationID,
                },
            },
            customer_creation: 'always',
        } : {},
        ...isRecurring ? {
            subscription_data: {
                metadata: {
                    ...metadata,
                },
            },
        } : {},
        custom_text: {
            submit: {
                message: HappinessConfig.fiscalSponsorMode
                    ? `${validated.projectName} is a fiscally-sponsored nonprofit project of ${HappinessConfig.fiscalSponsorName}, a 501(c)(3) public charity. Our EIN is ${HappinessConfig.fiscalSponsorEIN}. Your donation is tax-deductible to the extent allowed by law.`
                    : `Your donation will be processed by ${HappinessConfig.name}, the platform that ${validated.projectName} is using to raise money.`,
            },
        },
        metadata: {
            ...metadata,
            donationID,
        },
    });

    if (!checkout.url) throw new HappinessError('Stripe checkout session URL not found.', 500, { checkout });

    return checkout.url;
};
