import { getDonationsStats } from '@db/ops/donations/getDonationsStats';
import { authorize } from '@v1/middleware/authorize';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';

/**
 * Aggregates donation stats across a set of pages.
 */
export const GET = async (request: Request) => {
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const { searchParams } = new URL(request.url);

        const pagesParam = searchParams.get('pages');
        const pages = (pagesParam ?? '')
            .split(',')
            .map((pageID) => pageID.trim())
            .filter(Boolean);

        if (!pages.length) {
            return ErrorResponse.badRequest(
                'At least one page ID must be supplied via the `pages` query parameter',
            ).json;
        }

        const sinceParam = searchParams.get('since');
        const since = sinceParam ? new Date(sinceParam) : undefined;

        if (since && Number.isNaN(since.getTime())) {
            return ErrorResponse.badRequest(
                'The `since` query parameter must be a valid date',
                { since: sinceParam },
            ).json;
        }

        return NextResponse.json(await getDonationsStats({ pages, since }));
    } catch (e) {
        return handleErrors(e);
    }
};
