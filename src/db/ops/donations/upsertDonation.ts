import { db } from '@db/init';
import { validateReturn } from '@db/ops/shared';
import {
    donations,
    donors,
    insertDonationSchema,
    insertDonorSchema,
    pages,
    selectDonationSchema,
} from '@db/schema';
import { eq } from 'drizzle-orm';
import { generateID, Prefixes } from 'src/util/generateID';
import { HappinessError } from 'src/util/HappinessError';
import type { z } from 'zod';

/**
 * Creates a new donation, upserting the donor data.
 *
 * In general, this should be triggered in response to a webhook from a payment processor, but can be used directly to record donations manually (e.g. for cash or check donations).
 *
 * @param body - The initial values for the donation.
 * @param donor - The initial values for the donor. Requires first name, last name, and email. If the donor's email already exists, it will be updated.
 */
export const upsertDonation = async (
    body: z.infer<typeof insertDonationSchema> | unknown,
    donor: z.infer<typeof insertDonorSchema> | unknown,
) => {
    const createdAt = new Date();

    const validated = await insertDonationSchema
        .omit({ donorID: true })
        .parseAsync(body);
    const validatedDonor = await insertDonorSchema.parseAsync(donor);

    const id = validated.id || generateID(Prefixes.Donation);

    const query = await db.transaction(async (tx) => {
        // Ensure page exists
        const pageQuery = await tx.query.pages.findFirst({
            columns: { id: true },
            where: eq(pages.id, validated.pageID),
        });

        if (!pageQuery?.id) {
            try {
                tx.rollback();
            } catch (_e) {
                // Graceful catch so we can throw a more helpful error
            }
            throw new HappinessError('No such page found', 404, {
                pageQuery,
                validated,
                validatedDonor,
            });
        }

        // Upsert donor
        const donorQuery = await tx
            .insert(donors)
            .values({
                ...validatedDonor,
                createdAt,
                updatedAt: createdAt,
            })
            .onDuplicateKeyUpdate({
                set: {
                    ...validatedDonor,
                },
            });

        // Retrieve donor ID
        const donorData = await tx.query.donors.findFirst({
            where: eq(donors.email, validatedDonor.email),
        });

        if (!donorData?.id) {
            try {
                tx.rollback();
            } catch (_e) {
                // Graceful catch so we can throw a more helpful error
            }
            throw new HappinessError('Failed to create or update donor', 500, {
                body,
                donor,
                donorQuery,
                donorData,
            });
        }

        // If the donation already exists and has been refunded, skip the update
        if (validated.id) {
            const existing = await tx.query.donations.findFirst({
                where: eq(donations.id, validated.id),
                columns: { refunded: true },
            });
            if (existing?.refunded) {
                try {
                    tx.rollback();
                } catch (_e) {
                    // Graceful catch so we can throw a more helpful error
                }
                throw new HappinessError(
                    'Donation has been refunded and cannot be updated',
                    409,
                    { id: validated.id },
                );
            }
        }

        const donationData = {
            feeCovered: false,
            message: null,
            externalTransactionProvider: null,
            externalTransactionID: null,
            ...validated,
            donorID: donorData.id,
            id,
            createdAt,
            updatedAt: createdAt,
        };

        // Insert donation
        await tx
            .insert(donations)
            .values(donationData)
            .onDuplicateKeyUpdate({
                set: {
                    ...validated,
                    donorID: donorData.id,
                },
            });

        return donationData;
    });

    return validateReturn(selectDonationSchema, query);
};
