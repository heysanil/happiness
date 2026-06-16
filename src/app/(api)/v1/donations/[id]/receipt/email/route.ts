import { getDonation } from '@db/ops/donations/getDonation';
import type { Donor, Page } from '@db/schema';
import { sendDonationConfirmation } from '@lib/email/sendDonationConfirmation';
import { authorize } from '@v1/middleware/authorize';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
    email: z.string().email().optional(),
});

/**
 * Resends the donation receipt confirmation email. Optionally accepts an
 * `email` override; if omitted, the donor's email on file is used. The override
 * is one-off and does not modify the donor record.
 */
export const POST = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params;
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const rawBody = await request.json().catch(() => ({}));
        const { email: overrideEmail } = bodySchema.parse(rawBody);

        const donation = (await getDonation(params.id, {
            include: { donor: true, page: true },
        })) as Awaited<ReturnType<typeof getDonation>> & {
            donor?: Donor;
            page?: Page;
        };

        if (!donation.donor) {
            return ErrorResponse.badRequest('Donation has no associated donor')
                .json;
        }
        if (!donation.page) {
            return ErrorResponse.badRequest('Donation has no associated page')
                .json;
        }

        const targetEmail = overrideEmail ?? donation.donor.email;
        if (!targetEmail || targetEmail.endsWith('@donor.noemail')) {
            return ErrorResponse.badRequest(
                'Donor has no real email on file; provide an `email` override',
            ).json;
        }

        await sendDonationConfirmation({
            donationID: donation.id,
            donorEmail: targetEmail,
            donorName: donation.donor.firstName || 'Donor',
            amount: donation.amount,
            amountCurrency: donation.amountCurrency,
            campaignName: donation.page.name,
            organizer: donation.page.organizer,
            fsProject: donation.page.fsProject ?? null,
            date: donation.createdAt ?? new Date(),
        });

        return NextResponse.json({ ok: true, sentTo: targetEmail });
    } catch (e) {
        return handleErrors(e);
    }
};
