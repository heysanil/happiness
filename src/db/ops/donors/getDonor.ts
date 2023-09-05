import { z } from 'zod';
import { selectDonorSchema, donors, selectDonationSchema } from '@db/schema';
import { db } from '@db/init';
import { eq } from 'drizzle-orm';
import { HappinessError } from 'src/util/HappinessError';
import { validateReturn } from '@db/ops/shared';
import { Prefixes } from 'src/util/generateID';
import { validate } from 'email-validator';

/**
 * Retrieves a donor by ID or email.
 * @param search - The ID or email of the donor to retrieve.
 * @param options - Options for the query.
 */
export const getDonor = async (
    search: unknown,
    options?: {
        /** Relations to include in the query. */
        include?: {
            /** Whether to include donations in the query. */
            donations?: boolean;
        },
    },
): Promise<z.infer<typeof selectDonorSchema>> => {
    if (
        !search
        || typeof search !== 'string'
        || !(
            // Validate as email...
            validate(search)
            // ...or validate as ID
            || search.startsWith(Prefixes.Donor)
        )
    ) {
        throw new HappinessError('Missing or invalid donor ID or email', 400, { search });
    }

    const query = await db.query.donors.findFirst({
        where: validate(search) ? eq(donors.email, search) : eq(donors.id, search),
        with: {
            donations: options?.include?.donations ? true : undefined,
        },
    });

    if (!query) {
        throw new HappinessError('No such donor found', 404, { queryReturn: query });
    }

    return validateReturn(
        options?.include?.donations
            ? selectDonorSchema.merge(z.object({ donations: z.array(selectDonationSchema) }))
            : selectDonorSchema,
        query,
    );
};
