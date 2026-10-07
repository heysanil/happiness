import { db } from '@db/init';
import { validateID, validateReturn } from '@db/ops/shared';
import { donations } from '@db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

const pageStatsSchema = z.object({
    raised: z.number(),
    raisedSince: z.number(),
    donationCount: z.number(),
    donorCount: z.number(),
});

export const donationsStatsSchema = z.object({
    totals: pageStatsSchema,
    byPage: z.record(pageStatsSchema),
});

export type DonationsStats = z.infer<typeof donationsStatsSchema>;

const emptyPageStats = (): z.infer<typeof pageStatsSchema> => ({
    raised: 0,
    raisedSince: 0,
    donationCount: 0,
    donorCount: 0,
});

/**
 * Aggregates donation totals across a set of pages.
 *
 * `totals.donorCount` is a true `COUNT(DISTINCT donor_id)` over the whole page
 * set, so a donor who gave to several of the supplied pages is counted once.
 * It is therefore **not** the sum of the per-page `donorCount` values, and the
 * two will disagree whenever donors overlap between pages.
 *
 * Refunded donations are excluded, and `raised` counts the donation amount only
 * — tips and fees are not included — so these figures reconcile with the
 * `raised` value returned by `getPage`.
 *
 * @param options - Options for the query.
 */
export const getDonationsStats = async (options: {
    /** The page IDs to aggregate over. */
    pages: string[];
    /**
     * When supplied, `raisedSince` sums only donations created at or after this
     * date. Callers own the window (and therefore the timezone) so that the
     * definition of "this month" lives with the consumer, not the API.
     */
    since?: Date | null;
}): Promise<DonationsStats> => {
    for (const pageID of options.pages) {
        await validateID('Page', pageID);
    }

    // `inArray` with an empty list produces a degenerate always-false predicate,
    // so short-circuit rather than issuing a query that can only return nothing.
    if (!options.pages.length) {
        return { totals: emptyPageStats(), byPage: {} };
    }

    const where = and(
        inArray(donations.pageID, options.pages),
        eq(donations.refunded, false),
    );

    const raisedSince = options.since
        ? sql<number>`sum(case when ${donations.createdAt} >= ${options.since} then ${donations.amount} else 0 end)`
        : sql<number>`0`;

    const [grouped, [teamWide]] = await Promise.all([
        db
            .select({
                pageID: donations.pageID,
                raised: sql<number>`sum(${donations.amount})`,
                raisedSince,
                donationCount: sql<number>`count(*)`,
                donorCount: sql<number>`count(distinct ${donations.donorID})`,
            })
            .from(donations)
            .where(where)
            .groupBy(donations.pageID),
        // Counted separately from the grouped query because a DISTINCT count
        // cannot be recovered by summing per-page DISTINCT counts.
        db
            .select({
                donorCount: sql<number>`count(distinct ${donations.donorID})`,
            })
            .from(donations)
            .where(where),
    ]);

    // Seed every requested page so pages with no donations report zeroes rather
    // than being absent from the response.
    const byPage: Record<
        string,
        z.infer<typeof pageStatsSchema>
    > = Object.fromEntries(options.pages.map((id) => [id, emptyPageStats()]));

    const totals = emptyPageStats();

    for (const row of grouped) {
        // MySQL returns SUM()/COUNT() as strings via the serverless driver.
        const stats = {
            raised: Number(row.raised) || 0,
            raisedSince: Number(row.raisedSince) || 0,
            donationCount: Number(row.donationCount) || 0,
            donorCount: Number(row.donorCount) || 0,
        };

        byPage[row.pageID] = stats;

        totals.raised += stats.raised;
        totals.raisedSince += stats.raisedSince;
        totals.donationCount += stats.donationCount;
    }

    totals.donorCount = Number(teamWide?.donorCount) || 0;

    return validateReturn(donationsStatsSchema, { totals, byPage });
};
