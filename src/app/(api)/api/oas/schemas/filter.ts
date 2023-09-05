import type { ParameterObject } from 'openapi3-ts/oas30';
import { Prefixes } from 'src/util/generateID';

export const FilterParam = (
    filterBy: keyof typeof Prefixes,
): ParameterObject => ({
    name: filterBy.toLowerCase(),
    in: 'query',
    description: `Optionally, filter by connected ${filterBy}.`,
    example: `?${filterBy.toLowerCase()}=${Prefixes[filterBy]}_1a2b3c4d5e6f7`,
    schema: {
        type: 'string',
    },
});
