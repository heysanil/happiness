import type { z } from 'zod';
import { selectPageSchema, pages } from '@db/schema';
import { db } from '@db/init';
import { eq } from 'drizzle-orm';
import { HappinessError } from 'src/util/HappinessError';
import { validateID, validateReturn } from '@db/ops/shared';

/**
 * Retrieves a page by ID.
 * @param id - The ID of the page to retrieve.
 */
export const getPage = async (id: string): Promise<z.infer<typeof selectPageSchema>> => {
    await validateID('Page', id);

    const query = await db.query.pages.findFirst({
        where: eq(pages.id, id),
    });

    if (!query) {
        throw new HappinessError('No such page found', 404, { queryReturn: query });
    }

    return validateReturn(selectPageSchema, query);
};
