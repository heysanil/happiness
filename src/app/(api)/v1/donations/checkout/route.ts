import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';
import { createDonationCheckout } from '@lib/stripe/createDonationCheckout';
import { generateID, Prefixes } from 'src/util/generateID';

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const body = Object.fromEntries(searchParams.entries());

        // Generate a donation ID for this donation.
        const donationID = generateID(Prefixes.Donation);

        // Generate the success and cancel URLs.
        const successURL = new URL(request.url);
        successURL.pathname = '/v1/donations/checkout/success';
        successURL.search = '';
        const cancelURL = new URL(request.url);
        cancelURL.pathname = `/${body?.pageID}`;
        cancelURL.search = '';

        // Create the checkout session and redirect to it.
        return NextResponse.redirect(
            await createDonationCheckout(
                body,
                donationID,
                successURL.toString(),
                cancelURL.toString(),
            ),
            { status: 307 },
        );
    } catch (e) {
        return handleErrors(e);
    }
};
