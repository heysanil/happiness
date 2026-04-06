import 'src/app/globals.css';
import 'paris/theme/global.scss';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { HappinessConfig } from 'happiness.config';
import type { Metadata } from 'next';
import { generateCSS, theme } from 'paris/theme';
import { Toast } from 'paris/toast';
import { Themer } from 'src/util/Themer';

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
        <html lang="en">
            <head>
                <link rel="shortcut icon" href={HappinessConfig.favicon} />
                <link
                    rel="stylesheet"
                    href="https://slingshot.fm/fonts/graphik/graphik.css"
                />
                <style
                    id="pte-vars"
                    dangerouslySetInnerHTML={{
                        __html: generateCSS(theme),
                    }}
                />
                <Themer />
            </head>
            <body className="min-h-screen">
                {children}
                <Toast />
                <SpeedInsights />
            </body>
            <Analytics />
        </html>
    );
}
