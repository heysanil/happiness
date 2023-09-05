import type { OperationObject } from 'openapi3-ts/oas30';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import { IncludeParam } from '@docs/oas/schemas/include';
import { security } from '@docs/oas/schemas/security';

export const DONATIONS_ID_GET_SCHEMA: OperationObject = {
    operationId: 'getDonation',
    summary: 'Get a donation',
    description: 'Gets a specific donation.',
    tags: [
        'Donations',
    ],
    parameters: [
        {
            $ref: '#/components/parameters/id',
        },
        IncludeParam(['donor', 'page']),
    ],
    responses: {
        200: {
            description: 'Returns a [Donation](/schemas/Donation) object.',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/Donation',
                    },
                },
            },
        },
        ...errorResponses(),
    },
    security,
};
