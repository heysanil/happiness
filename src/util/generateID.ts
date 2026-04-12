import { createHash } from 'node:crypto';
import { customAlphabet } from 'nanoid';

export const nanoid = customAlphabet(
    '0123456789abcdefghijklmnopqrstuvwxyz',
    13,
);

/**
 * Generates an alphanumeric ID with a length of 13 characters, optionally prefixed with the given string and an underscore.
 *
 * @param prefix - The prefix to use for the ID. If not provided, no prefix will be used.
 * @param seed - Optional seed string. When provided, the ID is derived deterministically via SHA-256.
 */
export const generateID = (prefix?: string, seed?: string) => {
    const id = seed
        ? createHash('sha256').update(seed).digest('hex').slice(0, 13)
        : nanoid();
    return `${prefix}${prefix ? '_' : ''}${id}`;
};

export const Prefixes = {
    Page: 'pg',
    Donation: 'dn',
    Donor: 'dr',
} as const;
