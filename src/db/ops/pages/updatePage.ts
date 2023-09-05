import {
    updatePageSchema, pages, selectPageSchema,
} from '@db/schema';
import type { z } from 'zod';
import { db } from '@db/init';
import { eq } from 'drizzle-orm';
import { validateID, validateReturn } from '@db/ops/shared';

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

    await db.update(pages)
        .set({
            ...validated,
        })
        .where(eq(pages.id, id));

    return validateReturn(selectPageSchema.deepPartial(), {
        id,
        ...validated,
    });
};
