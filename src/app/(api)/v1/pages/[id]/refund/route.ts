import { NextResponse } from 'next/server';
import { authorize } from '@v1/middleware/authorize';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { getPage } from '@db/ops/pages/getPage';
import { updatePage } from '@db/ops/pages/updatePage';
import { listDonations } from '@db/ops/donations/listDonations';
import { refundPaymentIntent } from '@lib/stripe/refundPaymentIntent';
import { db } from '@db/init';
import { donations } from '@db/schema';
import { eq } from 'drizzle-orm';

const STRIPE_REFUND_WINDOW_DAYS = 180;

export const POST = async (
    request: Request,
    { params }: { params: { id: string } },
): Promise<NextResponse> => {
    try {
        if (!await authorize(request, 'root')) {
            return ErrorResponse.unauthorized().json;
        }

        const { id } = params;

        // Ensure the page exists
        const page = await getPage(id);

        // Fetch all donations for this page
        const allDonations = await listDonations({
            filter: { page: page.id },
        });

        const refundCutoff = new Date();
        refundCutoff.setDate(refundCutoff.getDate() - STRIPE_REFUND_WINDOW_DAYS);

        const results: {
            refunded: string[];
            skippedAlreadyRefunded: string[];
            skippedNoTransaction: string[];
            skippedTooOld: string[];
            failed: { id: string; error: string }[];
            totalRefundedAmount: number;
        } = {
            refunded: [],
            skippedAlreadyRefunded: [],
            skippedNoTransaction: [],
            skippedTooOld: [],
            failed: [],
            totalRefundedAmount: 0,
        };

        for (const donation of allDonations) {
            if (donation.refunded) {
                results.skippedAlreadyRefunded.push(donation.id);
                continue;
            }

            if (!donation.externalTransactionID || donation.externalTransactionProvider !== 'stripe') {
                results.skippedNoTransaction.push(donation.id);
                continue;
            }

            if (donation.createdAt < refundCutoff) {
                results.skippedTooOld.push(donation.id);
                continue;
            }

            try {
                await refundPaymentIntent(donation.externalTransactionID);
                await db.update(donations)
                    .set({ refunded: true })
                    .where(eq(donations.id, donation.id));
                results.refunded.push(donation.id);
                results.totalRefundedAmount += donation.amount;
            } catch (e) {
                results.failed.push({
                    id: donation.id,
                    error: e instanceof Error ? e.message : 'Unknown error',
                });
            }
        }

        // Set page to inactive after refunding
        await updatePage(page.id, { status: 'inactive' });

        return NextResponse.json({
            pageID: page.id,
            status: 'inactive',
            ...results,
        });
    } catch (e) {
        return handleErrors(e);
    }
};
