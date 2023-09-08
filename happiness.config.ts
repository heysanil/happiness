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
    defaultBaseURL: 'https://slingshot.giving',
    /**
     * The platform description, used for SEO/metadata purposes.
     */
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION as string || 'A donation page platform',
    /**
     * The platform's logo. SVG with a 1:1 ratio (square or circle) recommended. Can be a path relative to `public/` (recommended) or an absolute URL.
     */
    logo: process.env.NEXT_PUBLIC_LOGO as string || '/logo.svg',
    /**
     * The platform's favicon.
     */
    favicon: process.env.NEXT_PUBLIC_FAVICON as string || 'https://fast.slingshot.fm/sling/logo/icons-bw/favicon.ico',
    /**
     * Whether the platform is in "fiscal sponsor" mode. In this mode, donations are made to the platform, and the platform distributes them to the projects.
     */
    fiscalSponsorMode: ((process.env.NEXT_PUBLIC_FISCAL_SPONSOR_MODE as string).toLowerCase() || 'true') === 'true',
    /**
     * In fiscal sponsor mode, the name of the 501c3 organization that is the fiscal sponsor. This is used in receipts and disclaimers.
     */
    fiscalSponsorName: process.env.NEXT_PUBLIC_FISCAL_SPONSOR_NAME as string || 'Fiscal Sponsor Name',
    /**
     * In fiscal sponsor mode, the name of the 501c3 organization that is the fiscal sponsor. This is used in receipts and disclaimers.
     */
    fiscalSponsorEIN: process.env.NEXT_PUBLIC_FISCAL_SPONSOR_EIN as string || '00-0000000',
} as const;
