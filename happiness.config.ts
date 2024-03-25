/**
 * Shared configuration for the application.
 *
 * Where relevant, update values in the environment (through your deployment config or in `.env.local`) instead of here.
 */
export const HappinessConfig = {
    /**
     * The application name.
     */
    name: process.env.NEXT_PUBLIC_APP_NAME as string || 'Happiness',
    defaultBaseURL: process.env.NEXT_PUBLIC_DEFAULT_BASE_URL as string || 'https://slingshot.giving',
    /**
     * The platform description, used for SEO/metadata purposes.
     */
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION as string || 'A donation page platform',
    /**
     * The platform's logo. SVG with a 1:1 ratio (square or circle) recommended. Can be a path relative to `public/` (recommended) or an absolute URL.
     */
    logo: process.env.NEXT_PUBLIC_LOGO as string || '/logo.svg',
    /**
     * A wider logo, which will be used in spacious contexts (like the navbar) if provided.
     */
    logoWide: process.env.NEXT_PUBLIC_LOGO_WIDE as string | undefined,
    /**
     * The platform's favicon.
     */
    favicon: process.env.NEXT_PUBLIC_FAVICON as string || 'https://fast.slingshot.fm/sling/logo/icons-bw/favicon.ico',
    /**
     * Whether the platform is in "fiscal sponsor" mode. In this mode, donations are made to the platform, and the platform distributes them to the projects.
     */
    fiscalSponsorMode: ((process.env.NEXT_PUBLIC_FISCAL_SPONSOR_MODE as string | undefined)?.toLowerCase() || 'true') === 'true',
    /**
     * In fiscal sponsor mode, the name of the 501c3 organization that is the fiscal sponsor. This is used in receipts and disclaimers.
     */
    fiscalSponsorName: process.env.NEXT_PUBLIC_FISCAL_SPONSOR_NAME as string || 'Fiscal Sponsor Name',
    /**
     * In fiscal sponsor mode, the name of the 501c3 organization that is the fiscal sponsor. This is used in receipts and disclaimers.
     */
    fiscalSponsorEIN: process.env.NEXT_PUBLIC_FISCAL_SPONSOR_EIN as string || '00-0000000',
    /**
     * Hide the "Powered by Happiness" text in the footer. :(
     */
    hidePoweredByHappiness: ((process.env.NEXT_PUBLIC_HIDE_POWERED_BY as string | undefined)?.toLowerCase() || 'false') === 'true',
    /**
     * A platform fee, as a percentage of the donation amount. This is used to calculate the fee that is added to the donation amount. Defaults to 2%.
     */
    platformFee: Number(process.env.NEXT_PUBLIC_PLATFORM_FEE) || 0.02,
    /**
     * The description of the tip field. This is used in the donation form.
     */
    tipDescription: process.env.NEXT_PUBLIC_TIP_DESCRIPTION as string || 'Slingshot Giving builds the tools that make it easy for creators to run fundraisers like this. If you appreciate our work, consider leaving a tip to help us enable more creators to raise money for impactful causes.',
} as const;
