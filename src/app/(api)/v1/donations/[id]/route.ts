import { getDonation } from '@db/ops/donations/getDonation';
import { authorize } from '@v1/middleware/authorize';
import { parseQueryString } from '@v1/middleware/parseQueryString';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';

export const GET = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
) => {
    const params = await props.params;
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const queryParams = parseQueryString(new URL(request.url).searchParams);
        return NextResponse.json(
            await getDonation(params.id, {
                include: queryParams?.include
                    ? {
                          donor: Boolean(queryParams.include.donor),
                          page: Boolean(queryParams.include.page),
                      }
                    : undefined,
            }),
        );
    } catch (e) {
        return handleErrors(e);
    }
};
