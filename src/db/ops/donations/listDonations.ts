import { db } from '@db/init';
import { validateID, validateReturn } from '@db/ops/shared';
import {
    donations, selectDonationSchema, selectDonorSchema, selectPageSchema,
} from '@db/schema';
import { z } from 'zod';
import type { SQL } from 'drizzle-orm';
import { and, eq } from 'drizzle-orm';

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
            /** Whether to filter by donor ID. */
            donor?: string | null;
            /** Whether to filter by page ID. */
            page?: string | null;
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
    let where: SQL<unknown> | undefined;
    if (options?.filter?.donor && options?.filter?.page) {
        where = and(
            eq(donations.donorID, options.filter.donor),
            eq(donations.pageID, options.filter.page),
        );
    }
    if (options?.filter?.donor && !options?.filter?.page) {
        where = eq(donations.donorID, options.filter.donor);
    }
    if (!options?.filter?.donor && options?.filter?.page) {
        where = eq(donations.pageID, options.filter.page);
    }

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
