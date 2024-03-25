import { z } from 'zod';
import { HappinessConfig } from 'happiness.config';

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
    /** Tip for the platform. */
    tipPercent: number;
};

export const DonationConfigSchema = z.object({
    amount: z.number().int().positive(),
    frequency: z.enum(FrequencyOptions),
    message: z.string().optional(),
    coverFees: z.boolean(),
    anonymous: z.boolean(),
    projectName: z.string(),
    pageID: z.string(),
    tipPercent: z.number().gte(0),
});

const estFeePercent = 0.029 + HappinessConfig.platformFee;
const estFeeFlat = 30;
export const estimateFee = (amount: number) => (
    Math.round((amount + estFeeFlat) / (1 - estFeePercent)) - amount
);
