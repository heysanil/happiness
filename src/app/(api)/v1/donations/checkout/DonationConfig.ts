import { HappinessConfig } from 'happiness.config';
import { z } from 'zod';

export const FrequencyOptions = ['One-time', 'Monthly'] as const;
export type DonationConfig = {
    /** The amount to donate, in cents. This should never include estimated fees. */
    amount: number;
    /** The frequency of the donation. */
    frequency: (typeof FrequencyOptions)[number];
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
    /** Tip for the platform as a fraction (e.g. 0.1 = 10%). Used when tipFixed is 0. */
    tipPercent: number;
    /** Fixed tip amount in cents. When > 0, overrides tipPercent. */
    tipFixed: number;
    /** Donor email for receipts. */
    email: string;
    /** Donor name. */
    donorName: string;
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
    tipFixed: z.number().int().gte(0).optional().default(0),
    email: z.string().email(),
    donorName: z.string().optional().default(''),
});

const estFeePercent = 0.029 + HappinessConfig.platformFee;
const estFeeFlat = 30;
export const estimateFee = (amount: number) =>
    Math.round((amount + estFeeFlat) / (1 - estFeePercent)) - amount;

/** Compute the tip amount in cents. Uses tipFixed when > 0, otherwise tipPercent * baseAmount. */
export const computeTipAmount = (
    baseAmount: number,
    tipPercent: number,
    tipFixed: number,
) => (tipFixed > 0 ? tipFixed : Math.round(tipPercent * baseAmount));

/** Threshold in cents below which fixed-dollar tip presets are shown. */
export const TIP_FIXED_THRESHOLD = 2000;

/** Fixed-dollar tip presets in cents (for donations below threshold). */
export const TIP_FIXED_PRESETS = [100, 300, 500] as const;

/** Percentage tip presets as fractions (for donations at or above threshold). */
export const TIP_PERCENT_PRESETS = [0.05, 0.1, 0.15] as const;
