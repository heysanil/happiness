import { db } from '@db/init';
import { validateID, validateReturn } from '@db/ops/shared';
import {
    donations, selectDonationSchema, selectDonorSchema, selectPageSchema,
} from '@db/schema';
import { z } from 'zod';
import type { SQL, SQLWrapper } from 'drizzle-orm';
import {
    and, eq, lte, gte,
} from 'drizzle-orm';

/**
 * Retrieves all donations.
 * @param options - Options for the query.
 */
export const listDonations = async (
    options?: {
        /** Relations to include in the query. */
        include?: {
            /** Whether to include the donor in the query. */
            donor?: boolean;
            /** Whether to include the page in the query. */
            page?: boolean;
        },
        filter?: {
            /** Filter by donor ID. */
            donor?: string | null;
            /** Filter by page ID. */
            page?: string | null;
            /** Filter donations before a certain date. */
            before?: Date | null;
            /** Filter donations after a certain date. */
            after?: Date | null;
        },
        /** The number of results to return. */
        limit?: number;
        /** An order by expression for sorting the results. */
        sort?: SQL[];
    },
) => {
    // Validate filters, but allow falsy/undefined values
    await validateID('Donor', options?.filter?.donor, { allowFalsy: true });
    await validateID('Page', options?.filter?.page, { allowFalsy: true });

    // Build filter expression
    const filters: SQLWrapper[] = [];
    if (options?.filter?.donor) {
        filters.push(eq(donations.donorID, options.filter.donor));
    }
    if (options?.filter?.page) {
        filters.push(eq(donations.pageID, options.filter.page));
    }
    if (options?.filter?.before) {
        filters.push(lte(donations.createdAt, options.filter.before));
    }
    if (options?.filter?.after) {
        filters.push(gte(donations.createdAt, options.filter.after));
    }

    const where = and(...filters);

    const query = await db.query.donations.findMany({
        with: {
            donor: options?.include?.donor ? true : undefined,
            page: options?.include?.page ? true : undefined,
        },
        where,
        limit: options?.limit,
        orderBy: options?.sort,
    });

    return validateReturn(z.array(
        selectDonationSchema.merge(
            z.object({
                ...options?.include?.donor ? { donor: selectDonorSchema } : {},
                ...options?.include?.page ? { page: selectPageSchema } : {},
            }),
        ),
    ), query);
};
