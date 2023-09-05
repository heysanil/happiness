import type { ParameterObject, SchemaObject } from 'openapi3-ts/oas30';
import type { Prefixes } from 'src/util/generateID';

export const id = (prefix: typeof Prefixes[keyof typeof Prefixes]): SchemaObject['properties'] => ({
    id: {
        type: 'string',
        description: `A 13-character alphanumeric ID for the page, prefixed with "${prefix}_"`,
        example: `${prefix}_1a2b3c4d5e6f7`,
    },
});

export const IDParameter: ParameterObject = {
    name: 'id',
    in: 'path',
    description: 'The ID of the resource to retrieve. IDs are always 13-character alphanumeric strings prefixed with a 2-character resource type identifier and an underscore.',
    required: true,
    schema: {
        type: 'string',
        example: 'pg_1a2b3c4d5e6f7',
    },
};
