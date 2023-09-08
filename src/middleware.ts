import type { NextMiddleware } from 'next/server';
import { NextResponse } from 'next/server';

const alwaysBypass = {
    equals: [],
    startsWith: [],
    endsWith: [
        'openapi.json',
        'openapi.yaml',
    ],
    contains: [],
};

export const middleware: NextMiddleware = async (req) => {
    if (req.nextUrl.pathname === '/kindness') {
        return NextResponse.redirect('https://givebutter.com/kindnessiscool');
    }

    // Bypass the middleware for the following paths
    if (
        alwaysBypass.equals.some((path) => req.nextUrl.pathname === path)
        || alwaysBypass.startsWith.some((path) => req.nextUrl.pathname.startsWith(path))
        || alwaysBypass.endsWith.some((path) => req.nextUrl.pathname.endsWith(path))
        || alwaysBypass.contains.some((path) => req.nextUrl.pathname.includes(path))
    ) {
        return NextResponse.next();
    }

    // Rewrite all requests to /api/** to /api
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.rewrite(new URL('/api', req.url));
    }

    return NextResponse.next();
};
