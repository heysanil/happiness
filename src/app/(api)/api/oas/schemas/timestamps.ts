import type { SchemaObject } from 'openapi3-ts/oas30';

export const timestamps: SchemaObject['properties'] = {
    createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'The date and time of creation.',
        example: '2023-09-01T00:13:22.310Z',
    },
    updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'The date and time of the most recent update.',
        example: '2023-09-01T22:13:01.989Z',
    },
};
