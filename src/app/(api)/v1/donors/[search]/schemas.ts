import type { OperationObject } from 'openapi3-ts/oas30';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import { IncludeParam } from '@docs/oas/schemas/include';

export const DONORS_SEARCH_GET_SCHEMA: OperationObject = {
    operationId: 'getDonor',
    summary: 'Get a donor',
    description: 'Gets a specific donor by either the donor ID or email.',
    tags: [
        'Donors',
    ],
    parameters: [
        {
            name: 'search',
            in: 'path',
            description: 'The donor ID or email to match by.\n\nThese are both unique keys, so only one result will always be returned.',
            examples: {
                id: {
                    value: 'dn_1a2b3c4d5e6f7',
                },
                email: {
                    value: 'taylor@slingshot.fm',
                },
            },
            schema: {
                type: 'string',
            },
        },
        IncludeParam(['donations']),
    ],
    responses: {
        200: {
            description: 'Returns a [Donor](/schemas/Donor) object.',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/Donor',
                    },
                },
            },
        },
        ...errorResponses(),
    },
    security: [{ bearerAuth: [] }],
};
