import 'src/app/globals.css';
import 'paris/theme/global.scss';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { HappinessConfig } from 'happiness.config';
import type { Metadata } from 'next';

export const runtime = 'nodejs';

export const metadata: Metadata = {
    title: HappinessConfig.name,
    description: HappinessConfig.description,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="shortcut icon" href={HappinessConfig.favicon} />
            </head>
            <body>
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}
