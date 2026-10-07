import type { SchemaObject } from 'openapi3-ts/oas30';
import { Prefixes } from 'src/util/generateID';

const PageStatsProperties: SchemaObject['properties'] = {
    raised: {
        type: 'number',
        description:
            'The total amount raised, in cents, excluding refunded donations. Tips and fees are not included.',
        example: 125000,
    },
    raisedSince: {
        type: 'number',
        description:
            'The amount raised, in cents, from donations created at or after the `since` query parameter. Zero when `since` is omitted.',
        example: 25000,
    },
    donationCount: {
        type: 'number',
        description: 'The number of donations, excluding refunded donations.',
        example: 42,
    },
    donorCount: {
        type: 'number',
        description:
            'The number of distinct donors who have given, excluding refunded donations.',
        example: 37,
    },
};

const PageStatsSchema: SchemaObject = {
    type: 'object',
    properties: PageStatsProperties,
    required: ['raised', 'raisedSince', 'donationCount', 'donorCount'],
};

export const DonationsStatsSchema: SchemaObject = {
    type: 'object',
    description:
        'Aggregated donation stats for a set of pages, both combined and broken down per page.',
    properties: {
        totals: {
            ...PageStatsSchema,
            description:
                'Stats aggregated across every requested page. `donorCount` is a distinct count over the whole set, so a donor who gave to several of the requested pages is counted once — it is therefore not the sum of the per-page `donorCount` values.',
        },
        byPage: {
            type: 'object',
            description:
                'Stats per page, keyed by page ID. Every requested page is present; pages with no donations report zeroes.',
            additionalProperties: PageStatsSchema,
            example: {
                [`${Prefixes.Page}_1a2b3c4d5e6f7`]: {
                    raised: 125000,
                    raisedSince: 25000,
                    donationCount: 42,
                    donorCount: 37,
                },
            },
        },
    },
    required: ['totals', 'byPage'],
};
