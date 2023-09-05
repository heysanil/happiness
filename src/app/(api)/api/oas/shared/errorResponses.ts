import type { ResponsesObject, SchemaObject } from 'openapi3-ts/oas30';

export const ErrorSchema: SchemaObject = {
    type: 'object',
    description: 'An error returned by the API.',
    properties: {
        status: {
            type: 'number',
            description: 'The HTTP status code of the error.',
            example: 401,
        },
        message: {
            type: 'string',
            description: 'A human-readable message describing the error.',
            example: 'Unauthorized',
        },
        ...(process.env.NODE_ENV !== 'production' ? {
            debug: {
                type: 'object',
                description: 'In non-production environments, additional debugging information may be provided as an object.',
            },
        } : {}),
    },
    required: ['status', 'message'],
};

export const ErrorResponses: ResponsesObject = {
    Error400: {
        description: 'Bad request; returned when the request is malformed or invalid.',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/Error',
                },
            },
        },
    },
    Error401: {
        description: 'Unauthorized; returned when the request is not authenticated.',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/Error',
                },
            },
        },
    },
    Error403: {
        description: 'Forbidden; returned when the request is authenticated but the user does not have permission to perform the requested action.',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/Error',
                },
            },
        },
    },
    Error500: {
        description: 'Internal server error; returned when an unexpected error occurs on the server.',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/Error',
                },
            },
        },
    },
};

const allErrors = {
    400: {
        $ref: '#/components/responses/Error400',
    },
    401: {
        $ref: '#/components/responses/Error401',
    },
    403: {
        $ref: '#/components/responses/Error403',
    },
    500: {
        $ref: '#/components/responses/Error500',
    },
} as const;

type ErrorCode = keyof typeof allErrors;

export const errorResponses = (filter?: ErrorCode[]) => {
    if (filter) {
        return Object.fromEntries(
            Object.entries(allErrors).filter(([key]) => filter.includes(key as unknown as ErrorCode)),
        );
    }
    return allErrors;
};
