import type { OperationObject } from 'openapi3-ts/oas30';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import { PageSchema } from '@docs/oas/schemas/pages';

export const PAGES_GET_SCHEMA: OperationObject = {
    operationId: 'listPages',
    summary: 'List pages',
    description: 'Retrieves a list of all pages, optionally filtered by query parameters.',
    tags: [
        'Pages',
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
    tags: [
        'Pages',
    ],
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
