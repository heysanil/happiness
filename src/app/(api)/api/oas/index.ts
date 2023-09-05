import { OpenApiBuilder } from 'openapi3-ts/oas30';
import { PageSchema } from '@docs/oas/schemas/pages';
import { HappinessConfig } from 'happiness.config';
import { PAGES_ID_DELETE_SCHEMA, PAGES_ID_GET_SCHEMA, PAGES_ID_PATCH_SCHEMA } from '@v1/pages/[id]/schemas';
import { PAGES_GET_SCHEMA, PAGES_POST_SCHEMA } from '@v1/pages/schemas';
import { DonorSchema } from '@docs/oas/schemas/donors';
import { ErrorResponses, ErrorSchema } from '@docs/oas/shared/errorResponses';
import { IDParameter } from '@docs/oas/schemas/id';
import { bearerAuth } from '@docs/oas/schemas/security';
import { DONORS_GET_SCHEMA, DONORS_POST_SCHEMA } from '@v1/donors/schemas';
import { DonationSchema } from '@docs/oas/schemas/donations';
import { DONORS_SEARCH_GET_SCHEMA } from '@v1/donors/[search]/schemas';
import { DONATIONS_GET_SCHEMA, DONATIONS_POST_SCHEMA } from '@v1/donations/schemas';
import { DONATIONS_ID_GET_SCHEMA } from '@v1/donations/[id]/schemas';

export const oas = new OpenApiBuilder({
    openapi: '3.0.3',
    info: {
        title: `${HappinessConfig.name} API`,
        // eslint-disable-next-line global-require
        version: require('../../../../../package.json')?.version || '1.0.0',
        description: `${HappinessConfig.name} is a donation page platform powered by [Happiness](https://github.com/heysanil/happiness).`,
        'x-logo': {
            url: HappinessConfig.logo,
            backgroundColor: 'transparent',
            altText: `${HappinessConfig.name} Logo`,
        },
    },
    components: {
        parameters: { id: IDParameter },
        schemas: {
            Error: ErrorSchema,
            Page: PageSchema(true),
            PagePartial: PageSchema(true, true),
            Donor: DonorSchema(true),
            DonorPartial: DonorSchema(true, true),
            Donation: DonationSchema(true),
            DonationPartial: DonationSchema(true, true),
        },
        requestBodies: {},
        responses: { ...ErrorResponses },
        securitySchemes: { bearerAuth },
    },
    security: [],
    // TODO: Find a way to automatically generate this from the routes; should be possible by looking for named exports ending in `_{METHOD}_SCHEMA`
    paths: {
        '/v1/pages': {
            get: PAGES_GET_SCHEMA,
            post: PAGES_POST_SCHEMA,
        },
        '/v1/pages/{id}': {
            get: PAGES_ID_GET_SCHEMA,
            patch: PAGES_ID_PATCH_SCHEMA,
            delete: PAGES_ID_DELETE_SCHEMA,
        },
        '/v1/donors': {
            get: DONORS_GET_SCHEMA,
            post: DONORS_POST_SCHEMA,
        },
        '/v1/donors/{search}': {
            get: DONORS_SEARCH_GET_SCHEMA,
        },
        '/v1/donations': {
            get: DONATIONS_GET_SCHEMA,
            post: DONATIONS_POST_SCHEMA,
        },
        '/v1/donations/{id}': {
            get: DONATIONS_ID_GET_SCHEMA,
        },
    },
});
