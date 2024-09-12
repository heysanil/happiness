import 'src/app/globals.css';
import 'paris/theme/global.scss';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { HappinessConfig } from 'happiness.config';

const inter = Inter({ subsets: ['latin'] });

export const runtime = 'edge';

export const metadata: Metadata = {
    title: HappinessConfig.name,
    description: HappinessConfig.description,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="shortcut icon" href={HappinessConfig.favicon} />
            </head>
            <body className={inter.className}>
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}
