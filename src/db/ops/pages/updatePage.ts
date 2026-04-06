import { db } from '@db/init';
import { validateID, validateReturn } from '@db/ops/shared';
import { pages, selectPageSchema, updatePageSchema } from '@db/schema';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';

/**
 * Updates a page by ID.
 *
 * @param id - The ID of the page to update.
 * @param body - The new values for the page.
 */
export const updatePage = async (
    id: string,
    body: z.infer<typeof updatePageSchema> | unknown,
) => {
    await validateID('Page', id);

    const validated = await updatePageSchema.parseAsync(body);

    await db
        .update(pages)
        .set({
            ...validated,
        })
        .where(eq(pages.id, id));

    return validateReturn(selectPageSchema.deepPartial(), {
        id,
        ...validated,
    });
};
