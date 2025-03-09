import { handleErrors } from '@v1/responses/handleErrors';
import { authorize } from '@v1/middleware/authorize';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { parseQueryString } from '@v1/middleware/parseQueryString';
import { NextResponse } from 'next/server';
import { listDonations } from '@db/ops/donations/listDonations';
import { upsertDonation } from '@db/ops/donations/upsertDonation';

/**
 * Lists all donations.
 */
export const GET = async (request: Request) => {
    try {
        if (!await authorize(request, 'root')) {
            return ErrorResponse.unauthorized().json;
        }

        const { searchParams } = new URL(request.url);
        const queryParams = parseQueryString(searchParams);
        const donorFilter = searchParams.get('donor');
        const pageFilter = searchParams.get('page');

        const beforeFilter = searchParams.get('before');
        const afterFilter = searchParams.get('after');

        return NextResponse.json(await listDonations({
            include: queryParams?.include ? {
                donor: Boolean(queryParams.include.donor),
                page: Boolean(queryParams.include.page),
            } : undefined,
            filter: {
                donor: donorFilter,
                page: pageFilter,
                before: beforeFilter ? new Date(beforeFilter) : undefined,
                after: afterFilter ? new Date(afterFilter) : undefined,
            },
        }));
    } catch (e) {
        return handleErrors(e);
    }
};

/**
 * Creates a new donation. Body must be in format `{ donation: Donation, donor: Donor }`.
 */
export const POST = async (request: Request) => {
    try {
        if (!await authorize(request, 'root')) {
            return ErrorResponse.unauthorized().json;
        }

        const body = await request.json();

        // Check that body includes both donation and donor data
        if (!body.donation || !body.donor) {
            return ErrorResponse.badRequest('Donation and donor data must be included in request body').json;
        }

        return NextResponse.json(await upsertDonation(body.donation, body.donor), { status: 201 });
    } catch (e) {
        return handleErrors(e);
    }
};
