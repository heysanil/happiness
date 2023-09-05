import type { OperationObject } from 'openapi3-ts/oas30';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import { PageSchema } from '@docs/oas/schemas/pages';

export const PAGES_ID_GET_SCHEMA: OperationObject = {
    operationId: 'getPage',
    summary: 'Get a page',
    description: 'Gets a specific page.',
    tags: [
        'Pages',
    ],
    parameters: [
        {
            $ref: '#/components/parameters/id',
        },
    ],
    responses: {
        200: {
            description: 'Returns a [Page](/schemas/Page) object.',
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
};

export const PAGES_ID_PATCH_SCHEMA: OperationObject = {
    operationId: 'updatePage',
    summary: 'Update a page',
    description: 'Updates a page with the supplied body.',
    tags: [
        'Pages',
    ],
    parameters: [
        {
            $ref: '#/components/parameters/id',
        },
    ],
    requestBody: {
        description: 'Fields for updating an existing Page.',
        content: {
            'application/json': {
                schema: PageSchema(false, true),
            },
        },
    },
    responses: {
        200: {
            description: 'Returns only the ID and successfully-updated fields of the [Page](/schemas/Page) object.',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/PagePartial',
                    },
                },
            },
        },
        ...errorResponses(),
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
};
export const PAGES_ID_DELETE_SCHEMA: OperationObject = {
    operationId: 'deletePage',
    summary: 'Delete a page',
    description: 'Deletes a specific Page. Deleted Pages are moved to the `pages_deleted` table and can be manually restored or permanently deleted.',
    tags: [
        'Pages',
    ],
    parameters: [
        {
            $ref: '#/components/parameters/id',
        },
    ],
    responses: {
        204: {
            description: 'Returns an empty response upon successful deletion.',
        },
        ...errorResponses(),
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
};
