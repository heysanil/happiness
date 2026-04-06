import {
    DonationProperties,
    DonationRequired,
} from '@docs/oas/schemas/donations';
import { DonorSchema } from '@docs/oas/schemas/donors';
import { IncludeParam } from '@docs/oas/schemas/include';
import { PageSchema } from '@docs/oas/schemas/pages';
import { security } from '@docs/oas/schemas/security';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import type { OperationObject } from 'openapi3-ts/oas30';

export const DONATIONS_ID_GET_SCHEMA: OperationObject = {
    operationId: 'getDonation',
    summary: 'Get a donation',
    description: 'Gets a specific donation.',
    tags: ['Donations'],
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
                        type: 'object',
                        properties: {
                            ...DonationProperties(true),
                            donor: {
                                ...DonorSchema(true),
                                type: 'object',
                                description:
                                    'The donor who made this donation. Only included if the `include` query parameter includes `donor`.',
                            },
                            page: {
                                ...PageSchema(true),
                                type: 'object',
                                description:
                                    'The page this donation was made to. Only included if the `include` query parameter includes `page`.',
                            },
                        },
                        required: DonationRequired,
                    },
                },
            },
        },
        ...errorResponses([400, 401, 404, 500]),
    },
    security,
};
