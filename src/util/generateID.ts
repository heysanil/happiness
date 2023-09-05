import { customAlphabet } from 'nanoid';

export const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 13);

/**
 * Generates an alphanumeric ID with a length of 13 characters, optionally prefixed with the given string and an underscore.
 *
 * @param prefix - The prefix to use for the ID. If not provided, no prefix will be used.
 */
export const generateID = (prefix?: string) => `${prefix}${prefix ? '_' : ''}${nanoid()}`;

export const Prefixes = {
    Page: 'pg',
    Donation: 'dn',
    Donor: 'dr',
} as const;
