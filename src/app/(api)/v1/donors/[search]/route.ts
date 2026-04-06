import { getDonor } from '@db/ops/donors/getDonor';
import { authorize } from '@v1/middleware/authorize';
import { parseQueryString } from '@v1/middleware/parseQueryString';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';

export const GET = async (
    request: Request,
    props: { params: Promise<{ search: string }> },
) => {
    const params = await props.params;
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const queryParams = parseQueryString(new URL(request.url).searchParams);
        return NextResponse.json(
            await getDonor(params.search, {
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
