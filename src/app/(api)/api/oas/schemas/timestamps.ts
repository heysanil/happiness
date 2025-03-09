import type { ParameterObject, SchemaObject } from 'openapi3-ts/oas30';

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

export const beforeFilter: ParameterObject = {
    name: 'before',
    in: 'query',
    description: 'Optionally, filter results before a certain date.',
    example: '?before=2023-09-01T22:13:01.989Z',
    schema: {
        type: 'string',
        format: 'date-time',
        description: 'The date and time of the most recent update.',
        example: '2023-09-01T22:13:01.989Z',
    },
};

export const afterFilter: ParameterObject = {
    name: 'after',
    in: 'query',
    description: 'Optionally, filter results after a certain date.',
    example: '?after=2023-09-01T00:13:22.310Z',
    schema: {
        type: 'string',
        format: 'date-time',
        description: 'The date and time of the most recent update.',
        example: '2023-09-01T00:13:22.310Z',
    },
};

export const timestampFilters: ParameterObject[] = [
    beforeFilter,
    afterFilter,
];
