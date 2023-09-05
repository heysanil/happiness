import type { OperationObject } from 'openapi3-ts/oas30';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import { DonorProperties, DonorRequired, DonorSchema } from '@docs/oas/schemas/donors';
import { DonationProperties, DonationRequired, DonationSchema } from '@docs/oas/schemas/donations';
import { IncludeParam } from '@docs/oas/schemas/include';
import { security } from '@docs/oas/schemas/security';

export const DONORS_GET_SCHEMA: OperationObject = {
    operationId: 'listDonors',
    summary: 'List donors',
    description: 'Retrieves a list of all donors, optionally filtered by query parameters.',
    tags: [
        'Donors',
    ],
    parameters: [
        IncludeParam(['donations']),
    ],
    responses: {
        200: {
            description: 'Returns an array of [Donor](/schemas/Donor) objects.',
            content: {
                'application/json': {
                    schema: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                ...DonorProperties(true),
                                donations: {
                                    type: 'array',
                                    description: 'A list of donations made by this donor. Only included if the `include` query parameter includes `donations`.',
                                    items: DonationSchema(true),
                                },
                            },
                            required: DonorRequired,
                        },
                    },
                },
            },
        },
        ...errorResponses(),
    },
    security,
};

export const DONORS_POST_SCHEMA: OperationObject = {
    operationId: 'createDonor',
    summary: 'Create a donor',
    description: 'Creates a donor with the supplied body. If the provided email is already associated with a donor, the existing donor will be updated and returned.',
    tags: [
        'Donors',
    ],
    requestBody: {
        description: 'Fields for creating a new Donor.',
        content: {
            'application/json': {
                schema: DonorSchema(),
            },
        },
    },
    responses: {
        201: {
            description: 'Returns the created [Donor](/schemas/Donor) object.',
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
