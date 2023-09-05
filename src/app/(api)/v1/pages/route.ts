import { NextResponse } from 'next/server';
import { listPages } from '@db/ops/pages/listPages';
import { ErrorResponse } from '@v1/responses/ErrorResponse';
import { handleErrors } from '@v1/responses/handleErrors';
import { authorize } from '@v1/middleware/authorize';
import { createPage } from '@db/ops/pages/createPage';

export const GET = async (): Promise<NextResponse> => {
    try {
        return NextResponse.json(await listPages());
    } catch (e) {
        return handleErrors(e);
    }
};

export const POST = async (request: Request): Promise<NextResponse> => {
    try {
        if (!await authorize(request, 'root')) {
            return ErrorResponse.unauthorized().json;
        }

        const body = await request.json();

        return NextResponse.json(await createPage(body), { status: 201 });
    } catch (e) {
        return handleErrors(e);
    }
};
