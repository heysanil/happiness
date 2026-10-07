import { PageSchema } from '@docs/oas/schemas/pages';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import type { OperationObject } from 'openapi3-ts/oas30';
import { Prefixes } from 'src/util/generateID';

export const PAGES_GET_SCHEMA: OperationObject = {
    operationId: 'listPages',
    summary: 'List pages',
    description:
        'Retrieves a list of all pages, optionally filtered by query parameters.',
    tags: ['Pages'],
    parameters: [
        {
            name: 'ids',
            in: 'query',
            description:
                'Optionally, a comma-separated list of page IDs to restrict the results to. When omitted, every page is returned.',
            example: `?ids=${Prefixes.Page}_1a2b3c4d5e6f7,${Prefixes.Page}_7f6e5d4c3b2a1`,
            schema: {
                type: 'string',
            },
        },
    ],
    responses: {
        200: {
            description: 'Returns an array of [Page](/schemas/Page) objects.',
            content: {
                'application/json': {
                    schema: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/Page',
                        },
                    },
                },
            },
        },
        ...errorResponses(),
    },
};

export const PAGES_POST_SCHEMA: OperationObject = {
    operationId: 'createPage',
    summary: 'Create a page',
    description: 'Creates a page with the supplied body.',
    tags: ['Pages'],
    requestBody: {
        description: 'Fields for creating a new Page.',
        content: {
            'application/json': {
                schema: PageSchema(),
            },
        },
    },
    responses: {
        201: {
            description: 'Returns the created [Page](/schemas/Page) object.',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/Page',
                    },
                },
            },
        },
        ...errorResponses(),
    },
    security: [{ bearerAuth: [] }],
};
