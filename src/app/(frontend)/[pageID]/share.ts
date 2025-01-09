import { toast } from 'paris/toast';
import type { Page } from '@db/schema';
import { HappinessConfig } from 'happiness.config';

export const share = async (page: Page) => {
    if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        url.pathname = `/${page.slug}`;
        const content = `I just donated to ${page.title}, a fundraiser by ${page.organizer} on ${HappinessConfig.name}. Can you help spread the word or contribute? ${url.toString()}`;
        if (typeof window.navigator.share !== 'undefined') {
            await window.navigator.share({
                text: content,
            });
        } else {
            await window.navigator.clipboard.writeText(content);
            toast('Copied link to clipboard');
        }
    }
};
