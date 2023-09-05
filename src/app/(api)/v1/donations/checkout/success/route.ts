import { NextResponse } from 'next/server';
import { handleErrors } from '@v1/responses/handleErrors';
import { stripe } from '@lib/stripe';
import { z } from 'zod';
import type { Stripe } from 'stripe';
import { Prefixes } from 'src/util/generateID';
import { getPage } from '@db/ops/pages/getPage';

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const body = Object.fromEntries(searchParams.entries());
        const parsed = await z.object({
            session_id: z.string(),
        }).parseAsync(body);

        const cs = await stripe.checkout.sessions.retrieve(parsed.session_id, {
            expand: ['customer'],
        });

        // Get the page ID from the metadata.
        const metadata = await z.object({ pageID: z.string().startsWith(Prefixes.Page) }).spa(cs.metadata);

        const redirect = new URL(request.url);

        if (!metadata.success) {
            redirect.pathname = '/';
        } else {
            const { slug } = await getPage(metadata.data.pageID);
            if (!slug) {
                redirect.pathname = '/';
            }
            redirect.pathname = `/${slug}`;
        }

        redirect.search = `?thanks=${(cs.customer as Stripe.Customer).name}`;

        return NextResponse.redirect(redirect.toString(), { status: 307 });
    } catch (e) {
        return handleErrors(e);
    }
};
