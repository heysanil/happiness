import { listDonors } from '@db/ops/donors/listDonors';
import { upsertDonor } from '@db/ops/donors/upsertDonor';
import { authorize } from '@v1/middleware/authorize';
import { parseQueryString } from '@v1/middleware/parseQueryString';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const queryParams = parseQueryString(new URL(request.url).searchParams);
        return NextResponse.json(
            await listDonors({
                include: queryParams?.include
                    ? {
                          donations: Boolean(queryParams.include.donations),
                      }
                    : {},
            }),
        );
    } catch (e) {
        return handleErrors(e);
    }
};

export const POST = async (request: Request) => {
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const body = await request.json();

        return NextResponse.json(await upsertDonor(body), { status: 201 });
    } catch (e) {
        return handleErrors(e);
    }
};
