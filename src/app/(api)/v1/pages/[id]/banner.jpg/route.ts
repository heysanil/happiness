import { NextResponse } from 'next/server';
import { getPage } from '@db/ops/pages/getPage';
import { handleErrors } from '@v1/responses/handleErrors';

export const GET = async (
    request: Request,
    { params }: { params: { id: string } },
): Promise<NextResponse> => {
    try {
        const { id } = params;
        const page = await getPage(id);

        if (page.bannerType === 'image' && page.bannerURL) {
            // Download image from URL
            const response = await fetch(page.bannerURL);
            if (!response.ok) {
                return new NextResponse(null, { status: 404 });
            }
            const blob = await response.blob();
            if (!blob) {
                return new NextResponse(null, { status: 500 });
            }

            // Set response headers
            const headers = new Headers();
            headers.set('Content-Type', blob.type);
            headers.set('Content-Length', blob.size.toString());
            headers.set('Cache-Control', 'public, max-age=31536000');

            // Create a new response with the blob
            return new NextResponse(blob, {
                headers,
                status: 200,
            });
        } if (page.bannerType === 'embed' && page.bannerURL?.includes('youtube.com/embed')) {
            // Parse the URL
            const url = new URL(page.bannerURL);
            const videoId = url.pathname.split('?')[0].split('/').pop();

            // Download the video thumbnail
            const response = await fetch(`https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`);
            if (!response.ok) {
                return new NextResponse(null, { status: 404 });
            }
            const blob = await response.blob();
            if (!blob) {
                return new NextResponse(null, { status: 500 });
            }

            // Set response headers
            const headers = new Headers();
            headers.set('Content-Type', blob.type);
            headers.set('Content-Length', blob.size.toString());
            headers.set('Cache-Control', 'public, max-age=31536000');

            // Create a new response with the blob
            return new NextResponse(blob, {
                headers,
                status: 200,
            });
        }
        // Return image from public directory
        const currentHostname = new URL(request.url).host;
        const imagePath = `${currentHostname}/og.jpg`;
        const image = await fetch(imagePath);
        if (!image.ok) {
            return new NextResponse(null, { status: 404 });
        }
        const blob = await image.blob();
        if (!blob) {
            return new NextResponse(null, { status: 500 });
        }

        // Set response headers
        const headers = new Headers();
        headers.set('Content-Type', blob.type);
        headers.set('Content-Length', blob.size.toString());
        headers.set('Cache-Control', 'public, max-age=31536000');

        // Create a new response with the blob
        return new NextResponse(blob, {
            headers,
            status: 200,
        });
    } catch (e) {
        return handleErrors(e);
    }
};
