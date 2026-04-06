import { deletePage } from '@db/ops/pages/deletePage';
import { getPage } from '@db/ops/pages/getPage';
import { updatePage } from '@db/ops/pages/updatePage';
import { authorize } from '@v1/middleware/authorize';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { NextResponse } from 'next/server';

export const GET = async (
    _request: Request,
    props: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
    const params = await props.params;
    try {
        const { id } = params;
        return NextResponse.json(await getPage(id));
    } catch (e) {
        return handleErrors(e);
    }
};

export const PATCH = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
    const params = await props.params;
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const { id } = params;
        const body = await request.json();

        return NextResponse.json(await updatePage(id, body));
    } catch (e) {
        return handleErrors(e);
    }
};

export const DELETE = async (
    request: Request,
    props: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
    const params = await props.params;
    try {
        if (!(await authorize(request, 'root'))) {
            return ErrorResponse.unauthorized().json;
        }

        const { id } = params;
        await deletePage(id);
        return new NextResponse(undefined, { status: 204 });
    } catch (e) {
        return handleErrors(e);
    }
};
