import { errorResponses } from '@docs/oas/shared/errorResponses';
import type { OperationObject } from 'openapi3-ts/oas30';
import { Prefixes } from 'src/util/generateID';

export const DONATIONS_STATS_GET_SCHEMA: OperationObject = {
    operationId: 'getDonationsStats',
    summary: 'Get donation stats',
    description:
        'Aggregates donation stats across a set of pages, returning both combined totals and a per-page breakdown. Refunded donations are excluded, and amounts count the donation amount only — tips and fees are not included — so these figures reconcile with the `raised` value returned by [Get a page](/reference/getPage).',
    tags: ['Donations'],
    parameters: [
        {
            name: 'pages',
            in: 'query',
            required: true,
            description:
                'A comma-separated list of page IDs to aggregate over. At least one is required.',
            example: `?pages=${Prefixes.Page}_1a2b3c4d5e6f7,${Prefixes.Page}_7f6e5d4c3b2a1`,
            schema: {
                type: 'string',
            },
        },
        {
            name: 'since',
            in: 'query',
            description:
                'Optionally, a date from which to compute the `raisedSince` figures. Donations created at or after this date are included. When omitted, `raisedSince` is zero.',
            example: '?since=2023-09-01T00:00:00.000Z',
            schema: {
                type: 'string',
                format: 'date-time',
            },
        },
    ],
    responses: {
        200: {
            description:
                'Returns a [DonationsStats](/schemas/DonationsStats) object.',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/DonationsStats',
                    },
                },
            },
        },
        ...errorResponses(),
    },
    security: [{ bearerAuth: [] }],
};
