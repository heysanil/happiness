import type { SchemaObject } from 'openapi3-ts/oas30';
import { id } from '@docs/oas/schemas/id';
import { Prefixes } from 'src/util/generateID';
import { timestamps } from '@docs/oas/schemas/timestamps';
import { alwaysRequired } from '@docs/oas/shared/alwaysRequired';

export const DonorProperties = (
    /** Set `false` for creates or updates, to exclude fields like `id` and timestamps. */
    readOnly = false,
): SchemaObject['properties'] => ({
    ...readOnly ? id(Prefixes.Donor) : {},
    firstName: {
        type: 'string',
        description: 'The first name of the donor.',
        example: 'Taylor',
        maxLength: 255,
    },
    lastName: {
        type: 'string',
        description: 'The last name of the donor.',
        example: 'Swift',
        maxLength: 255,
    },
    company: {
        type: 'string',
        description: 'The company of the donor.',
        nullable: true,
        example: '13 Management',
    },
    email: {
        type: 'string',
        format: 'email',
        description: 'The email of the donor.',
        example: 'taylor@slingshot.fm',
        maxLength: 255,
    },
    phone: {
        type: 'string',
        description: 'The phone number of the donor, in [E.164](https://www.twilio.com/docs/glossary/what-e164) format.',
        nullable: true,
        example: '+14242452439',
        maxLength: 20,
    },
    anonymous: {
        type: 'boolean',
        description: "Whether the donor wishes to remain anonymous. If true, the donor's name should not be displayed publicly and should only be available to organization leaders.",
        default: false,
    },
    ...readOnly ? timestamps : {},
});

export const DonorRequired = [...alwaysRequired, 'email', 'firstName', 'lastName'];

export const DonorSchema = (
    /** Set `false` for creates or updates, to exclude fields like `id` and timestamps. */
    readOnly = false,
    /** Set `true` to make all fields optional; especially useful for update scenarios. */
    allFieldsOptional = false,
): SchemaObject => ({
    type: 'object',
    description: 'A donor is a person or organization that has donated to a page.',
    properties: DonorProperties(readOnly),
    ...allFieldsOptional ? { required: ['id'] } : { required: DonorRequired },
});
