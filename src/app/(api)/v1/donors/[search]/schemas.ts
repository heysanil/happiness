import { DonationSchema } from '@docs/oas/schemas/donations';
import { DonorProperties, DonorRequired } from '@docs/oas/schemas/donors';
import { IncludeParam } from '@docs/oas/schemas/include';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import type { OperationObject } from 'openapi3-ts/oas30';

export const DONORS_SEARCH_GET_SCHEMA: OperationObject = {
    operationId: 'getDonor',
    summary: 'Get a donor',
    description: 'Gets a specific donor by either the donor ID or email.',
    tags: ['Donors'],
    parameters: [
        {
            name: 'search',
            in: 'path',
            description:
                'The donor ID or email to match by.\n\nThese are both unique keys, so only one result will always be returned.',
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
                        type: 'object',
                        properties: {
                            ...DonorProperties(true),
                            donations: {
                                type: 'array',
                                description:
                                    'A list of donations made by this donor. Only included if the `include` query parameter includes `donations`.',
                                items: DonationSchema(true),
                            },
                        },
                        required: DonorRequired,
                    },
                },
            },
        },
        ...errorResponses([400, 401, 404, 500]),
    },
    security: [{ bearerAuth: [] }],
};
