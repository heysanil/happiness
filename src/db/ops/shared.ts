import { Prefixes } from 'src/util/generateID';
import { HappinessError } from 'src/util/HappinessError';
import { z } from 'zod';
import type { ZodType, ZodTypeDef } from 'zod';
import { DebugMode } from 'src/constants';
import { fromZodError } from 'zod-validation-error';

/**
 * Validates a resource ID.
 * @param resourceType - The type of resource to validate.
 * @param id - The ID to validate.
 * @param options - Additional options.
 */
export const validateID = async (
    resourceType: keyof typeof Prefixes,
    id: any,
    options?: {
        /** Whether to allow `undefined` or falsy values */
        allowFalsy?: boolean;
    },
) => {
    if (!id && !options?.allowFalsy) {
        throw new HappinessError(`Missing ${resourceType.toLowerCase()} ID`, 400, { id });
    } else if (id) {
        const validation = await z.string().startsWith(Prefixes[resourceType]).spa(id);
        if (!validation.success) {
            throw new HappinessError(`Invalid ${resourceType.toLowerCase()} ID`, 400, { id, validation });
        }
    }
};

/**
 * Validates a return object against a Zod schema.
 *
 * Only validates in production if `options.alwaysValidate` is `true`; otherwise, the original `returnObject` is just returned without any validation performed.
 *
 * @param schema - The Zod schema to validate against.
 * @param returnObject - The object to validate.
 * @param options - Additional options.
 */
export const validateReturn = async <A, B extends ZodTypeDef, C>(
    schema: ZodType<A, B, C>,
    returnObject: A,
    options?: {
        /** Whether to always validate, even in production. By default, validation is skipped in production. */
        alwaysValidate?: boolean;
        /** Whether to throw or just print a warning. Defaults to `false` (i.e. a warning is printed, but no error is thrown). */
        throw?: boolean;
    },
): Promise<A> => {
    // Skip validation in production unless explicitly told not to.
    if (options?.alwaysValidate || DebugMode) {
        // Validate the return object against the schema.
        const validate = await schema.safeParseAsync(returnObject);

        if (!validate.success) {
            // Throw an error if `options.throw` is `true`, otherwise print a warning.
            if (options?.throw) {
                throw validate.error;
            }

            // Print a warning.
            console.warn('WARNING - Return object validation failed.', fromZodError(validate.error).toString(), { error: validate.error, returnObject });
        } else {
            // Return the validated data.
            return validate.data as z.infer<typeof schema>;
        }
    }

    // Return the return object.
    return returnObject as z.infer<typeof schema>;
};
