'use client';

import { openDonateDrawer } from '@frontend/[pageID]/donateDrawerStore';
import { Button } from 'paris/button';

/**
 * Trigger for the page-level DonateDrawer. A page may render any number of
 * these (e.g. StoryPage's mobile summary + desktop sticky card); they all
 * open the single drawer mounted by the page — see DonateDrawer.
 */
export const DonateButton = ({ className = '' }: { className?: string }) => (
    <Button onClick={() => openDonateDrawer()} className={className}>
        Donate
    </Button>
);
