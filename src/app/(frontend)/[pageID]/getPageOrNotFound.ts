import { getPage } from '@db/ops/pages/getPage';
import type { selectPageSchema } from '@db/schema';
import { notFound } from 'next/navigation';
import { HappinessError } from 'src/util/HappinessError';
import type { z } from 'zod';

/**
 * Retrieves a page by ID or slug, rendering the not-found page (with a 404
 * status) when no page matches. Other errors are rethrown.
 * @param search - The ID or slug of the page to retrieve.
 */
export const getPageOrNotFound = async (
    search: string,
): Promise<z.infer<typeof selectPageSchema>> => {
    try {
        return await getPage(search);
    } catch (error) {
        if (error instanceof HappinessError && error.status === 404) {
            notFound();
        }
        throw error;
    }
};
