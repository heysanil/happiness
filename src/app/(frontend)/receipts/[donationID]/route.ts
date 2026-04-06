import { getDonation } from '@db/ops/donations/getDonation';
import type { Donor, Page } from '@db/schema';
import { generateReceipt } from '@lib/receipt/DonationReceipt';
import { handleErrors } from '@v1/responses/handleErrors';
import { HappinessConfig } from 'happiness.config';

export const GET = async (
    _req: Request,
    props: { params: Promise<{ donationID: string }> },
) => {
    const params = await props.params;
    try {
        const donation = await getDonation(params.donationID, {
            include: { page: true, donor: true },
        });

        const donationWithRels = donation as typeof donation & {
            page: Page;
            donor: Donor;
        };

        const buffer = await generateReceipt({
            donation: {
                id: donation.id,
                amount: donation.amount,
                amountCurrency: donation.amountCurrency,
                createdAt: donation.createdAt,
            },
            donor: {
                firstName: donationWithRels.donor.firstName,
                lastName: donationWithRels.donor.lastName,
                email: donationWithRels.donor.email,
                company: donationWithRels.donor.company ?? null,
            },
            page: {
                name: donationWithRels.page.name,
                organizer: donationWithRels.page.organizer,
                fsProject: donationWithRels.page.fsProject ?? null,
            },
            config: {
                name: HappinessConfig.name,
                fiscalSponsorMode: HappinessConfig.fiscalSponsorMode,
                fiscalSponsorName: HappinessConfig.fiscalSponsorName,
                fiscalSponsorEIN: HappinessConfig.fiscalSponsorEIN,
            },
        });

        return new Response(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="receipt-${donation.id}.pdf"`,
            },
        });
    } catch (e) {
        return handleErrors(e);
    }
};
