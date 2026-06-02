import { db } from '@db/init';
import { validateID, validateReturn } from '@db/ops/shared';
import {
    donations,
    donors,
    pages,
    selectDonationSchema,
    selectDonorSchema,
    selectPageSchema,
} from '@db/schema';
import type { SQL, SQLWrapper } from 'drizzle-orm';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Retrieves all donations.
 * @param options - Options for the query.
 */
export const listDonations = async (options?: {
    /** Relations to include in the query. */
    include?: {
        /** Whether to include the donor in the query. */
        donor?: boolean;
        /** Whether to include the page in the query. */
        page?: boolean;
    };
    filter?: {
        /** Filter by donor ID. */
        donor?: string | null;
        /** Filter by page ID. */
        page?: string | null;
        /** Filter donations before a certain date. */
        before?: Date | null;
        /** Filter donations after a certain date. */
        after?: Date | null;
        /**
         * When true, the donor's personally identifiable information
         * (first name, last name, company, email, phone) is redacted at the
         * SQL layer for anonymous donors: the query returns NULL for those
         * columns whenever `donors.anonymous` is true, so anonymous PII is
         * never read out of the database. The donation row and the donor's
         * `anonymous` flag are still returned. Only takes effect when the
         * donor relation is included.
         */
        redactAnonymous?: boolean;
    };
    /** The number of results to return. */
    limit?: number;
    /** An order by expression for sorting the results. */
    sort?: SQL[];
}) => {
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

    // Redacted path: when redacting anonymous donors' PII, fetch the donor via
    // explicit SQL CASE expressions so anonymous PII is never read from the DB.
    // Drizzle's relational query API (used below) can't express per-column CASE
    // overrides, so this path uses a manual join + select instead.
    if (options?.filter?.redactAnonymous && options?.include?.donor) {
        const redact = (column: SQLWrapper) =>
            sql<
                string | null
            >`CASE WHEN ${donors.anonymous} = TRUE THEN NULL ELSE ${column} END`;

        const rows = await db
            .select({
                donation: donations,
                donor: {
                    id: donors.id,
                    createdAt: donors.createdAt,
                    updatedAt: donors.updatedAt,
                    anonymous: donors.anonymous,
                    firstName: redact(donors.firstName),
                    lastName: redact(donors.lastName),
                    company: redact(donors.company),
                    email: redact(donors.email),
                    phone: redact(donors.phone),
                },
                page: pages,
            })
            .from(donations)
            // donorID / pageID are non-null FKs, so the related rows always
            // exist; innerJoin keeps the donor/page columns non-nullable.
            .innerJoin(donors, eq(donations.donorID, donors.id))
            .innerJoin(pages, eq(donations.pageID, pages.id))
            .where(where)
            .limit(options?.limit ?? Number.MAX_SAFE_INTEGER)
            .orderBy(...(options?.sort ?? []));

        const shaped = rows.map((row) => ({
            ...row.donation,
            donor: row.donor,
            ...(options?.include?.page ? { page: row.page } : {}),
        }));

        // Donor PII columns become nullable on the redacted path.
        const redactedDonorSchema = selectDonorSchema.extend({
            firstName: selectDonorSchema.shape.firstName.nullable(),
            lastName: selectDonorSchema.shape.lastName.nullable(),
            email: selectDonorSchema.shape.email.nullable(),
        });

        return validateReturn(
            z.array(
                selectDonationSchema.merge(
                    z.object({
                        donor: redactedDonorSchema,
                        ...(options?.include?.page
                            ? { page: selectPageSchema }
                            : {}),
                    }),
                ),
            ),
            shaped,
        );
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

    return validateReturn(
        z.array(
            selectDonationSchema.merge(
                z.object({
                    ...(options?.include?.donor
                        ? { donor: selectDonorSchema }
                        : {}),
                    ...(options?.include?.page
                        ? { page: selectPageSchema }
                        : {}),
                }),
            ),
        ),
        query,
    );
};
