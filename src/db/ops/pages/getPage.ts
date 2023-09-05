import { z } from 'zod';
import { selectPageSchema, pages } from '@db/schema';
import { db } from '@db/init';
import { eq } from 'drizzle-orm';
import { HappinessError } from 'src/util/HappinessError';
import { validateReturn } from '@db/ops/shared';
import { Prefixes } from 'src/util/generateID';

/**
 * Retrieves a page by ID or slug.
 * @param search - The ID or slug of the page to retrieve.
 */
export const getPage = async (search: string): Promise<z.infer<typeof selectPageSchema>> => {
    await z.string().parseAsync(search);

    const query = await db.query.pages.findFirst({
        where: search.startsWith(Prefixes.Page) ? eq(pages.id, search) : eq(pages.slug, search),
    });

    if (!query) {
        throw new HappinessError('No such page found', 404, { queryReturn: query });
    }

    return validateReturn(selectPageSchema, query);
};
