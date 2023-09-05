import type { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { DatabaseError } from '@planetscale/database';
import { HappinessError } from 'src/util/HappinessError';
import { DebugMode } from 'src/constants';
import { ErrorResponse } from '@v1/responses/ErrorResponse';

/**
 * Handle errors and return a {@link NextResponse} to be sent to the client
 * @param e - The error to handle
 */
export const handleErrors = <T extends Error = Error>(e: unknown | T): NextResponse => {
    // Log the error
    console.error(e);

    // Check if the error is a {@link HappinessError}
    if (e instanceof HappinessError) {
        return new ErrorResponse(
            e.status,
            e.message,
            DebugMode ? { happinessError: e } : undefined,
        ).json;
    }

    // Check if the error is a Zod error
    if (e instanceof ZodError) {
        const parsedError = fromZodError(e);
        return ErrorResponse.badRequest(
            `Invalid \`${parsedError.details[0].path.join('.')}\` field: ${parsedError.details[0].message}`,
            DebugMode ? { zodError: e, parsedError } : undefined,
        ).json;
    }

    // Check if the error is a PlanetScale database error
    if (e instanceof DatabaseError) {
        return new ErrorResponse(
            e.status,
            'Database returned an error',
            { dbError: e },
        ).json;
    }

    // Check if the error is a {@link Error} where we can return a generic error response
    if (e instanceof Error) {
        // Check if the error is a JWT error
        if (e.name === 'JWTExpired') {
            return ErrorResponse.unauthorized('Unauthorized; token expired', { joseError: e }).json;
        }
        if (e.name === 'JWTInvalid') {
            return ErrorResponse.unauthorized(`Unauthorized; ${e?.message}`, { joseError: e }).json;
        }
        if (e.name === 'JWTClaimValidationFailed') {
            return ErrorResponse.unauthorized(`Unauthorized; ${e?.message}`, { joseError: e }).json;
        }

        return ErrorResponse.internalServerError(`${e.name}: ${e.message}`, { genericError: e }).json;
    }

    // Fallback to a generic internal server error
    return ErrorResponse.internalServerError('Internal server error', { otherError: e }).json;
};
