import { db } from '@db/init';
import { validateReturn } from '@db/ops/shared';
import { selectDonationSchema, selectDonorSchema } from '@db/schema';
import { z } from 'zod';

/**
 * Retrieves all donors.
 * @param options - Options for the query.
 */
export const listDonors = async (
    options?: {
        /** Relations to include in the query. */
        include?: {
            /** Whether to include donations in the query. */
            donations?: boolean;
        },
    },
) => {
    const query = await db.query.donors.findMany({
        with: {
            donations: options?.include?.donations ? true : undefined,
        },
    });

    return validateReturn(z.array(
        options?.include?.donations
            ? selectDonorSchema.merge(z.object({ donations: z.array(selectDonationSchema) }))
            : selectDonorSchema,
    ), query);
};
