import { db } from '@db/init';
import { validateReturn } from '@db/ops/shared';
import { selectPageSchema } from '@db/schema';
import { z } from 'zod';

/**
 * Retrieves all pages.
 */
export const listPages = async () => {
    const query = await db.query.pages.findMany();

    return validateReturn(z.array(selectPageSchema), query);
};
