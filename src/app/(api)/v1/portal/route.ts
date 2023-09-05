import { NextResponse } from 'next/server';
import { getPortalURL } from '@lib/stripe/getPortalURL';
import { handleErrors } from '@v1/responses/handleErrors';

export const GET = async () => {
    try {
        return NextResponse.redirect(await getPortalURL(), { status: 307 });
    } catch (e) {
        return handleErrors(e);
    }
};
