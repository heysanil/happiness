import { handleErrors } from '@v1/responses/handleErrors';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createDonationCheckout } from '@lib/stripe/createDonationCheckout';
import { generateID, Prefixes } from 'src/util/generateID';

export const GET = async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const body = Object.fromEntries(searchParams.entries());

        // Generate a donation ID for this donation.
        const donationID = generateID(Prefixes.Donation);

        // Generate the success and cancel URLs.
        const successURL = request.nextUrl.clone();
        successURL.pathname = '/v1/donations/checkout/success';
        successURL.search = '';
        successURL.hash = '';
        const cancelURL = request.nextUrl.clone();
        cancelURL.pathname = `/${body?.pageID}`;
        cancelURL.search = '';
        cancelURL.hash = '';

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
