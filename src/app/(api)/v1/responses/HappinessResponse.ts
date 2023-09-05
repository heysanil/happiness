/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

/**
 * @class HappinessResponse
 * A generic response class for API responses
 */
export class HappinessResponse {
    constructor(
        /** The HTTP status code */
        public status: number,
        /** The headers to return */
        public headers: Record<string, string>,
        /** The body to return */
        public body: string,
    ) {
        this.status = status;
        this.headers = headers;
        this.body = body;
    }

    /**
     * Stringifies the given object with Slingshot's standard formatting
     * @param object - The object to return
     */
    static stringify(object: Record<string, any>) {
        return JSON.stringify(object, null, 2);
    }

    /** Returns a JSON {@link NextResponse} with the given parameters */
    static json(status: number, body: Record<string, any>) {
        return new NextResponse(this.stringify(body), {
            status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /** Returns a JSON {@link NextResponse} with the current parameters of this response */
    get json() {
        return new NextResponse(this.body, {
            status: this.status,
            headers: {
                'Content-Type': 'application/json',
                ...this.headers,
            },
        });
    }

    /** Returns a {@link NextResponse} that redirects the user to a given URL */
    static redirect(url: string, init?: ResponseInit) {
        return NextResponse.redirect(url, init);
    }
}
