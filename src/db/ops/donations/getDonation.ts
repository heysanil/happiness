import { db } from '@db/init';
import { validateID, validateReturn } from '@db/ops/shared';
import {
    donations, selectDonationSchema, selectDonorSchema, selectPageSchema,
} from '@db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { HappinessError } from 'src/util/HappinessError';

/**
 * Gets a donation by ID.
 * @param id - The ID of the donation to retrieve.
 * @param options - Options for the query.
 */
export const getDonation = async (
    id: string,
    options?: {
        /** Relations to include in the query. */
        include?: {
            /** Whether to include the donor in the query. */
            donor?: boolean;
            /** Whether to include the page in the query. */
            page?: boolean;
        }
    },
) => {
    await validateID('Donation', id);

    const query = await db.query.donations.findFirst({
        with: {
            donor: options?.include?.donor ? true : undefined,
            page: options?.include?.page ? true : undefined,
        },
        where: eq(donations.id, id),
    });

    if (!query) {
        throw new HappinessError('No such donation found', 404, { id });
    }

    return validateReturn(selectDonationSchema.merge(
        z.object({
            ...options?.include?.donor ? { donor: selectDonorSchema } : {},
            ...options?.include?.page ? { page: selectPageSchema } : {},
        }),
    ), query);
};
