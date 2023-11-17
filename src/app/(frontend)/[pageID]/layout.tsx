import type { ReactNode } from 'react';
import { HappinessConfig } from 'happiness.config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    metadataBase: new URL(HappinessConfig.defaultBaseURL),
};

export default function PageLayout({ children }: {
    children: ReactNode,
}) {
    return (
        <>
            {children}
        </>
    );
}
