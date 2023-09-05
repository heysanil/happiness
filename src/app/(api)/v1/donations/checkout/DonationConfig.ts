import { z } from 'zod';

export const FrequencyOptions = ['One-time', 'Monthly'] as const;
export type DonationConfig = {
    /** The amount to donate, in cents. This should never include estimated fees. */
    amount: number;
    /** The frequency of the donation. */
    frequency: typeof FrequencyOptions[number];
    /** The ID of the page to donate to. */
    message: string;
    /** The ID of the donor. */
    coverFees: boolean;
    /** Whether the donor wants to cover the fees. */
    anonymous: boolean;
    /** The project name to use in receipts. */
    projectName: string;
    /** The ID of the page receiving the donation. */
    pageID: string;
};

export const DonationConfigSchema = z.object({
    amount: z.number().int().positive(),
    frequency: z.enum(FrequencyOptions),
    message: z.string().optional(),
    coverFees: z.boolean(),
    anonymous: z.boolean(),
    projectName: z.string(),
    pageID: z.string(),
});

const estFeePercent = 0.029;
const estFeeFlat = 30;
export const estimateFee = (amount: number) => (
    Math.round((amount + estFeeFlat) / (1 - estFeePercent)) - amount
);
