import { security } from '@docs/oas/schemas/security';
import { errorResponses } from '@docs/oas/shared/errorResponses';
import type { OperationObject } from 'openapi3-ts/oas30';

export const DONATIONS_ID_RECEIPT_EMAIL_POST_SCHEMA: OperationObject = {
    operationId: 'resendDonationReceiptEmail',
    summary: 'Resend donation receipt email',
    description:
        "Resends the donation receipt confirmation email for a specific donation. If `email` is provided in the body, the receipt is sent to that address instead of the donor's email on file. The override is one-off and does not modify the donor record.",
    tags: ['Donations'],
    parameters: [
        {
            $ref: '#/components/parameters/id',
        },
    ],
    requestBody: {
        description:
            "Optional override email address. If omitted, the donor's email on file is used.",
        required: false,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description:
                                "Override email address to send the receipt to. If omitted, the donor's email on file is used.",
                            example: 'donor@example.com',
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description:
                'Receipt email was sent successfully. Returns the address it was sent to.',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            ok: {
                                type: 'boolean',
                                example: true,
                            },
                            sentTo: {
                                type: 'string',
                                format: 'email',
                                example: 'donor@example.com',
                            },
                        },
                        required: ['ok', 'sentTo'],
                    },
                },
            },
        },
        ...errorResponses([400, 401, 404, 500]),
    },
    security,
};
