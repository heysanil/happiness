/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextResponse } from 'next/server';
import { HappinessResponse } from '@v1/responses/HappinessResponse';
import { DebugMode } from 'src/constants';

/**
 * @class ErrorResponse
 * A generic response class for API error responses
 * @extends HappinessResponse
 */
export class ErrorResponse extends HappinessResponse {
    constructor(
        /** The HTTP status code */
        public status: number,
        /** The message to return */
        public message?: string,
        /** The debug information to return in non-production environments */
        public debug?: Record<string, any>,
    ) {
        super(status, {
            'Content-Type': 'application/json',
        }, HappinessResponse.stringify({
            status,
            message,
            ...(DebugMode ? { debug } : {}),
        }));
    }

    /**
     * Returns a {@link ErrorResponse} with a 400 status code. Generally, chain this with `.json` to form a {@link NextResponse} that can be sent as a response on Edge routes.
     * @example ```typescript
     * SlingErrorResponse.badRequest('Invalid `include` fields: "teamx"').json;
     * ```
     * @param message - The message to return
     * @param debug - The debug information to return
     */
    static badRequest(message = 'Bad request', debug?: Record<string, any>) {
        return new ErrorResponse(400, message, debug);
    }

    /**
     * Returns a {@link ErrorResponse} with a 401 status code. Generally, chain this with `.json` to form a {@link NextResponse} that can be sent as a response on Edge routes.
     * @example ```typescript
     * SlingErrorResponse.unauthorized('No key provided').json;
     * ```
     * @param message - The message to return
     * @param debug - The debug information to return
     */
    static unauthorized(message = 'Unauthorized', debug?: Record<string, any>) {
        return new ErrorResponse(401, message, debug);
    }

    /**
     * Returns a {@link ErrorResponse} with a 403 status code. Generally, chain this with `.json` to form a {@link NextResponse} that can be sent as a response on Edge routes.
     * @example ```typescript
     * SlingErrorResponse.forbidden('User does not have access to edit this team').json;
     * ```
     * @param message - The message to return
     * @param debug - The debug information to return
     */
    static forbidden(message = 'Forbidden', debug?: Record<string, any>) {
        return new ErrorResponse(403, message, debug);
    }

    /**
     * Returns a {@link ErrorResponse} with a 404 status code. Generally, chain this with `.json` to form a {@link NextResponse} that can be sent as a response on Edge routes.
     * @example ```typescript
     * SlingErrorResponse.forbidden('User does not have access to edit this team').json;
     * ```
     * @param message - The message to return
     * @param debug - The debug information to return
     */
    static notFound(message = 'Not found', debug?: Record<string, any>) {
        return new ErrorResponse(404, message, debug);
    }

    /**
     * Returns a {@link ErrorResponse} with a 405 status code. Generally, chain this with `.json` to form a {@link NextResponse} that can be sent as a response on Edge routes.
     * @example ```typescript
     * SlingErrorResponse.methodNotAllowed().json;
     * ```
     * @param message - The message to return
     * @param debug - The debug information to return
     */
    static methodNotAllowed(message = 'Method not allowed', debug?: Record<string, any>) {
        return new ErrorResponse(405, message, debug);
    }

    /**
     * Returns a {@link ErrorResponse} with a 422 status code. Generally, chain this with `.json` to form a {@link NextResponse} that can be sent as a response on Edge routes.
     * @example ```typescript
     * SlingErrorResponse.unprocessableEntity().json;
     * ```
     * @param message - The message to return
     * @param debug - The debug information to return
     */
    static unprocessableEntity(message = 'Unprocessable entity', debug?: Record<string, any>) {
        return new ErrorResponse(422, message, debug);
    }

    /**
     * Returns a {@link ErrorResponse} with a 500 status code. Generally, chain this with `.json` to form a {@link NextResponse} that can be sent as a response on Edge routes.
     * @example ```typescript
     * SlingErrorResponse.internalServerError('Error connecting to database').json;
     * ```
     * @param message - The message to return
     * @param debug - The debug information to return
     */
    static internalServerError(message = 'Internal server error', debug?: Record<string, any>) {
        return new ErrorResponse(500, message, debug);
    }

    /**
     * Returns a {@link ErrorResponse} with a 501 status code. Generally, chain this with `.json` to form a {@link NextResponse} that can be sent as a response on Edge routes.
     * @example ```typescript
     * SlingErrorResponse.notImplemented('This endpoint is not currently publicly available.').json;
     * ```
     * @param message - The message to return
     * @param debug - The debug information to return
     */
    static notImplemented(message = 'Not implemented', debug?: Record<string, any>) {
        return new ErrorResponse(501, message, debug);
    }
}
