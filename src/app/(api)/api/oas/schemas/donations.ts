import type { SchemaObject } from 'openapi3-ts/oas30';
import { id } from '@docs/oas/schemas/id';
import { Prefixes } from 'src/util/generateID';
import { timestamps } from '@docs/oas/schemas/timestamps';
import { alwaysRequired } from '@docs/oas/shared/alwaysRequired';

export const DonationProperties = (
    /** Set `false` for creates or updates, to exclude fields like `id` and timestamps. */
    readOnly = false,
): SchemaObject['properties'] => ({
    ...readOnly ? id(Prefixes.Donation) : {},
    pageID: {
        type: 'string',
        description: 'The ID of the page to which the donation was made.',
        example: 'pg_1a2b3c4d5e6f7',
    },
    ...readOnly ? {
        donorID: {
            type: 'string',
            description: 'The ID of the donor who made the donation.',
            example: 'dn_1a2b3c4d5e6f7',
        },
    } : {},
    amount: {
        type: 'number',
        description: 'The amount of the donation, in USD cents.',
        example: 10000,
    },
    amountCurrency: {
        type: 'string',
        description: 'The currency of the donation amount.',
        enum: ['usd'],
        example: 'usd',
    },
    fee: {
        type: 'number',
        description: 'The fee charged by the payment processor, in USD cents.',
        example: 300,
    },
    feeCurrency: {
        type: 'string',
        description: 'The currency of the fee.',
        enum: ['usd'],
        example: 'usd',
    },
    feeCovered: {
        type: 'boolean',
        description: 'Whether the fee was covered by the donor. Note that if the fee is covered, the `amount` field will already reflect the covered fee, so the net amount received will still be `amount - fee`.',
        example: true,
    },
    visible: {
        type: 'boolean',
        description: 'Whether the donation should be visible on the page. If false, the donation should be hidden from public view.',
        example: true,
    },
    message: {
        type: 'string',
        description: 'The message left by the donor, if any.',
        nullable: true,
        example: 'Keep up the good work!',
    },
    externalTransactionProvider: {
        type: 'string',
        description: 'The payment processor used to process the donation. If null, the donation was added manually.',
        enum: ['stripe'],
        example: 'stripe',
        nullable: true,
    },
    externalTransactionID: {
        type: 'string',
        description: 'The ID of the transaction or charge in the payment processor. Mainly used for internal reconciliation.',
        nullable: true,
        example: 'ch_1a2b3c4d5e6f7',
    },
    ...readOnly ? timestamps : {},
});

export const DonationRequired = [...alwaysRequired, 'pageID', 'donorID', 'amount', 'amountCurrency'];

export const DonationSchema = (
    /** Set `false` for creates or updates, to exclude fields like `id` and timestamps. */
    readOnly = false,
    /** Set `true` to make all fields optional; especially useful for update scenarios. */
    allFieldsOptional = false,
): SchemaObject => ({
    type: 'object',
    description: 'A donor is a person or organization that has donated to a page.',
    properties: DonationProperties(readOnly),
    ...allFieldsOptional ? { required: ['id'] } : { required: DonationRequired },
});
