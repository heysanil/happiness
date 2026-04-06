import { db } from '@db/init';
import { validateReturn } from '@db/ops/shared';
import { donations, pages, selectPageSchema } from '@db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { Prefixes } from 'src/util/generateID';
import { HappinessError } from 'src/util/HappinessError';
import { z } from 'zod';

/**
 * Retrieves a page by ID or slug.
 * @param search - The ID or slug of the page to retrieve.
 */
export const getPage = async (
    search: string,
): Promise<z.infer<typeof selectPageSchema>> => {
    await z.string().parseAsync(search);

    const query = await db.query.pages.findFirst({
        where: search.startsWith(Prefixes.Page)
            ? eq(pages.id, search)
            : eq(pages.slug, search),
    });

    if (!query) {
        throw new HappinessError('No such page found', 404, {
            queryReturn: query,
        });
    }

    const [{ raised }] = await db
        .select({
            raised: sql<number>`sum(${donations.amount})`,
        })
        .from(donations)
        .where(
            and(eq(donations.pageID, query.id), eq(donations.refunded, false)),
        );

    return validateReturn(selectPageSchema, {
        ...query,
        raised: Number(raised) || 0,
    });
};
