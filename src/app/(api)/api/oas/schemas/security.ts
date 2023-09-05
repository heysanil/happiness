import type { SecurityRequirementObject, SecuritySchemeObject } from 'openapi3-ts/oas30';

/**
 * Security scheme for endpoints that require authentication.
 */
export const bearerAuth: SecuritySchemeObject = {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'API key',
    description: 'Requests involving sensitive data or administrative actions are authenticated using an API key.',
};

/**
 * Standard security requirement for endpoints that require authentication.
 */
export const security: SecurityRequirementObject[] = [{ bearerAuth: [] }];
