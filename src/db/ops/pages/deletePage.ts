import { pages, pagesDeleted } from '@db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@db/init';
import { validateID } from '@db/ops/shared';
import { HappinessError } from 'src/util/HappinessError';

/**
 * Deletes a page by ID. This is a soft delete, and the page will still be available in the database in the `pages_deleted` table.
 *
 * Truncating the `pages_deleted` table regularly is recommended.
 *
 * @param id - The ID of the page to delete.
 */
export const deletePage = async (
    id: string,
): Promise<void> => {
    await validateID('Page', id);

    // Get the page to be deleted
    const page = await db.query.pages.findFirst({
        where: eq(pages.id, id),
    });

    // If the page doesn't exist, return a 404
    if (!page) {
        throw new HappinessError('No such page found', 404, { queryReturn: page });
    }

    // Create a new record in the deleted table, and delete the original
    // This is done in a transaction to ensure that both queries succeed or fail together
    await db.transaction(async (tx) => {
        await tx.insert(pagesDeleted).values(page);
        await tx.delete(pages).where(eq(pages.id, id));
    });
};
