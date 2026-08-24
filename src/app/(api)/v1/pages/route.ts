import { createPage } from '@db/ops/pages/createPage';
import { listPages } from '@db/ops/pages/listPages';
import { authorize } from '@v1/middleware/authorize';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';

export const GET = async (request: Request): Promise<NextResponse> => {
    try {
        const { searchParams } = new URL(request.url);
        const idsParam = searchParams.get('ids');

        return NextResponse.json(
            await listPages({
                filter: {
                    ids: idsParam
                        ? idsParam
                              .split(',')
                              .map((id) => id.trim())
                              .filter(Boolean)
                        : undefined,
                },
            }),
        );
    } catch (e) {
        return handleErrors(e);
    }
};

export const POST = async (request: Request): Promise<NextResponse> => {
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const body = await request.json();

        return NextResponse.json(await createPage(body), { status: 201 });
    } catch (e) {
        return handleErrors(e);
    }
};
