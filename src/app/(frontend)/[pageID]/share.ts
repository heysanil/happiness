import type { Page } from '@db/schema';
import { HappinessConfig } from 'happiness.config';

export const share = async (page: Page) => {
    if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        url.pathname = `/${page.slug}`;
        await window.navigator.share({
            text: `I just donated to ${page.title}, a fundraiser by ${page.organizer} on ${HappinessConfig.name}. Can you help spread the word or contribute? ${url.toString()}`,
        });
    }
};
