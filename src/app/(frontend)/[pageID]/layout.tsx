import { HappinessConfig } from 'happiness.config';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    metadataBase: new URL(HappinessConfig.defaultBaseURL),
};

export default function PageLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
