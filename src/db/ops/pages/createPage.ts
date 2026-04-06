import { db } from '@db/init';
import { validateReturn } from '@db/ops/shared';
import { insertPageSchema, pages, selectPageSchema } from '@db/schema';
import { generateID, Prefixes } from 'src/util/generateID';
import type { z } from 'zod';

/**
 * Creates a new page.
 *
 * @param body - The initial values for the page.
 */
export const createPage = async (
    body: z.infer<typeof insertPageSchema> | unknown,
) => {
    const id = generateID(Prefixes.Page);
    const createdAt = new Date();

    const validated = await insertPageSchema.parseAsync(body);

    const _query = await db.insert(pages).values({
        ...validated,
        id,
        createdAt,
        updatedAt: createdAt,
    });

    return validateReturn(selectPageSchema, {
        id,
        ...validated,
        createdAt,
        updatedAt: createdAt,
    });
};
