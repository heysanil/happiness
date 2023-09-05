import type { ParameterObject } from 'openapi3-ts/oas30';

export const IncludeParam = (
    relationsAllowed: string[],
): ParameterObject => ({
    name: 'include',
    in: 'query',
    description: 'Include relations in the response.',
    example: `?include=${relationsAllowed.join(',')}`,
    schema: {
        type: 'array',
        items: {
            type: 'string',
            enum: relationsAllowed,
        },
    },
    style: 'form',
    explode: false,
});
