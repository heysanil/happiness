import type { OperationObject } from 'openapi3-ts/oas30';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import { DonationProperties, DonationRequired, DonationSchema } from '@docs/oas/schemas/donations';
import { IncludeParam } from '@docs/oas/schemas/include';
import { DonorSchema } from '@docs/oas/schemas/donors';
import { PageSchema } from '@docs/oas/schemas/pages';
import { FilterParam } from '@docs/oas/schemas/filter';

export const DONATIONS_GET_SCHEMA: OperationObject = {
    operationId: 'listDonations',
    summary: 'List donations',
    description: 'Retrieves a list of all donations, optionally filtered by query parameters.',
    tags: [
        'Donations',
    ],
    parameters: [
        IncludeParam(['donor', 'page']),
        FilterParam('Page'),
        FilterParam('Donor'),
    ],
    responses: {
        200: {
            description: 'Returns an array of [Donation](/schemas/Donation) objects.',
            content: {
                'application/json': {
                    schema: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                ...DonationProperties(true),
                                donor: {
                                    ...DonorSchema(true),
                                    type: 'object',
                                    description: 'The donor who made this donation. Only included if the `include` query parameter includes `donor`.',
                                },
                                page: {
                                    ...PageSchema(true),
                                    type: 'object',
                                    description: 'The page this donation was made to. Only included if the `include` query parameter includes `page`.',
                                },
                            },
                            required: DonationRequired,
                        },
                    },
                },
            },
        },
        ...errorResponses(),
    },
    security: [{ bearerAuth: [] }],
};

export const DONATIONS_POST_SCHEMA: OperationObject = {
    operationId: 'createDonation',
    summary: 'Create a donation',
    description: 'Creates a donation with the supplied donation and donor data. If the provided email is already associated with a donation, the existing donation will be updated and returned.',
    tags: [
        'Donations',
    ],
    requestBody: {
        description: 'Fields for creating a new Donation. You must provide both the donation information as well as donor information.',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        donor: {
                            ...DonorSchema(),
                            description: 'The information for the donor who made this donation.',
                        },
                        donation: {
                            ...DonationSchema(),
                            description: 'The information for this specific donation.',
                        },
                    },
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Returns the created [Donation](/schemas/Donation) object.',
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
    security: [{ bearerAuth: [] }],
};
