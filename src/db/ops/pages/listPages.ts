import { db } from '@db/init';
import { validateID, validateReturn } from '@db/ops/shared';
import { pages, selectPageSchema } from '@db/schema';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Retrieves all pages.
 *
 * Note that `raised` is returned as stored on the page row, which is not
 * maintained — only {@link getPage} computes it from donations. Callers needing
 * amounts for a set of pages should pair this with `getDonationsStats`.
 *
 * @param options - Options for the query.
 */
export const listPages = async (options?: {
    filter?: {
        /** Filter to a specific set of page IDs. */
        ids?: string[] | null;
    };
}) => {
    const ids = options?.filter?.ids;

    for (const id of ids ?? []) {
        await validateID('Page', id);
    }

    // An explicitly empty ID filter matches nothing; without the short-circuit
    // `inArray` would build a degenerate predicate.
    if (ids && !ids.length) {
        return validateReturn(z.array(selectPageSchema), []);
    }

    const query = await db.query.pages.findMany({
        where: ids ? inArray(pages.id, ids) : undefined,
    });

    return validateReturn(z.array(selectPageSchema), query);
};
