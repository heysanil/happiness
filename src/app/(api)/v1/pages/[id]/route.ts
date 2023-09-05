import { NextResponse } from 'next/server';
import { getPage } from '@db/ops/pages/getPage';
import { updatePage } from '@db/ops/pages/updatePage';
import { deletePage } from '@db/ops/pages/deletePage';
import { handleErrors } from '@v1/responses/handleErrors';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { authorize } from '@v1/middleware/authorize';

export const GET = async (
    request: Request,
    { params }: { params: { id: string } },
): Promise<NextResponse> => {
    try {
        const { id } = params;
        return NextResponse.json(await getPage(id));
    } catch (e) {
        return handleErrors(e);
    }
};

export const PATCH = async (
    request: Request,
    { params }: { params: { id: string } },
): Promise<NextResponse> => {
    try {
        if (!await authorize(request, 'root')) {
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
    { params }: { params: { id: string } },
): Promise<NextResponse> => {
    try {
        if (!await authorize(request, 'root')) {
            return ErrorResponse.unauthorized().json;
        }

        const { id } = params;
        await deletePage(id);
        return new NextResponse(undefined, { status: 204 });
    } catch (e) {
        return handleErrors(e);
    }
};
