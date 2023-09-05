import {
    insertDonorSchema, donors, selectDonorSchema,
} from '@db/schema';
import type { z } from 'zod';
import { db } from '@db/init';
import { validateReturn } from '@db/ops/shared';
import { eq } from 'drizzle-orm';
import { HappinessError } from 'src/util/HappinessError';

/**
 * Creates a new donor, or updates an existing donor if the email or id provided already exists.
 *
 * @param body - The initial values for the donor.
 */
export const upsertDonor = async (
    body: z.infer<typeof insertDonorSchema> | unknown,
) => {
    const validated = await insertDonorSchema.parseAsync(body);

    const query = await db.transaction(async (tx) => {
        await tx
            .insert(donors)
            .values({
                ...validated,
            })
            .onDuplicateKeyUpdate({
                set: {
                    ...validated,
                },
            });
        return tx.query.donors.findFirst({
            where: eq(donors.email, validated.email),
        });
    });

    if (!query) {
        throw new HappinessError('Failed to create donor', 500, { body, query });
    }

    return validateReturn(selectDonorSchema, query);
};
