import { db } from '@db/init';
import { listDonations } from '@db/ops/donations/listDonations';
import { getPage } from '@db/ops/pages/getPage';
import { updatePage } from '@db/ops/pages/updatePage';
import type { Donation } from '@db/schema';
import { donations } from '@db/schema';
import { refundPaymentIntent } from '@lib/stripe/refundPaymentIntent';
import { authorize } from '@v1/middleware/authorize';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const STRIPE_REFUND_WINDOW_DAYS = 180;

export const POST = async (
    request: Request,
    { params }: { params: { id: string } },
): Promise<NextResponse> => {
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const { id } = params;

        // Ensure the page exists
        const page = await getPage(id);

        // Fetch all donations for this page
        const allDonations = (await listDonations({
            filter: { page: page.id },
        })) as Donation[];

        const refundCutoff = new Date();
        refundCutoff.setDate(
            refundCutoff.getDate() - STRIPE_REFUND_WINDOW_DAYS,
        );

        const skippedAlreadyRefunded = allDonations
            .filter((d) => d.refunded)
            .map((d) => d.id);

        const skippedNoTransaction = allDonations
            .filter(
                (d) =>
                    !d.refunded &&
                    (!d.externalTransactionID ||
                        d.externalTransactionProvider !== 'stripe'),
            )
            .map((d) => d.id);

        const skippedTooOld = allDonations
            .filter(
                (d) =>
                    !d.refunded &&
                    d.externalTransactionID &&
                    d.externalTransactionProvider === 'stripe' &&
                    d.createdAt < refundCutoff,
            )
            .map((d) => d.id);

        const refundable = allDonations.filter(
            (d) =>
                !d.refunded &&
                d.externalTransactionID &&
                d.externalTransactionProvider === 'stripe' &&
                d.createdAt >= refundCutoff,
        );

        const refundResults = await Promise.allSettled(
            refundable.map(async (donation) => {
                await refundPaymentIntent(donation.externalTransactionID!);
                await db
                    .update(donations)
                    .set({ refunded: true })
                    .where(eq(donations.id, donation.id));
                return donation;
            }),
        );

        const results = refundResults.reduce(
            (acc, result, i) => {
                if (result.status === 'fulfilled') {
                    acc.refunded.push(result.value.id);
                    acc.totalRefundedAmount += result.value.amount;
                } else {
                    acc.failed.push({
                        id: refundable[i].id,
                        error:
                            result.reason instanceof Error
                                ? result.reason.message
                                : 'Unknown error',
                    });
                }
                return acc;
            },
            {
                refunded: [] as string[],
                skippedAlreadyRefunded,
                skippedNoTransaction,
                skippedTooOld,
                failed: [] as { id: string; error: string }[],
                totalRefundedAmount: 0,
            },
        );

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
