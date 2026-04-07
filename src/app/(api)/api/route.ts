import { ApiReference } from '@scalar/nextjs-api-reference';
import { HappinessConfig } from 'happiness.config';

export const GET = ApiReference({
    url: '/api/openapi.json',
    theme: 'deepSpace',
    pageTitle: `${HappinessConfig.name} API`,
    metaData: {
        title: `${HappinessConfig.name} API`,
    },
});
