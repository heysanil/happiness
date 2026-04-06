// ---------------------------------------------------------------------------
// Lightweight E2E API client wrapping fetch with root-auth support
// ---------------------------------------------------------------------------

import { API_KEY, BASE_URL } from './fixtures';

export class TestAPIClient {
    constructor(
        private baseURL: string,
        private apiKey: string,
    ) {}

    // -- Internal request helper ---------------------------------------------

    private async request<T = unknown>(
        method: string,
        path: string,
        body?: unknown,
        auth = true,
    ): Promise<{ status: number; data: T }> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (auth) {
            headers.Authorization = `Bearer ${this.apiKey}`;
        }

        const res = await fetch(`${this.baseURL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // For 204 No Content there is no body to parse
        if (res.status === 204) {
            return { status: res.status, data: undefined as T };
        }

        const data: T = await res.json();
        return { status: res.status, data };
    }

    // -- Pages ----------------------------------------------------------------

    createPage(data: Record<string, unknown>) {
        return this.request('POST', '/v1/pages', data);
    }

    /** Public — no auth required */
    getPage(idOrSlug: string) {
        return this.request('GET', `/v1/pages/${idOrSlug}`, undefined, false);
    }

    /** Public — no auth required */
    listPages() {
        return this.request('GET', '/v1/pages', undefined, false);
    }

    updatePage(id: string, data: Record<string, unknown>) {
        return this.request('PATCH', `/v1/pages/${id}`, data);
    }

    deletePage(id: string) {
        return this.request('DELETE', `/v1/pages/${id}`);
    }

    // -- Donations ------------------------------------------------------------

    /**
     * Create a donation. Body format: `{ donation: {...}, donor: {...} }`
     */
    createDonation(data: {
        donation: Record<string, unknown>;
        donor: Record<string, unknown>;
    }) {
        return this.request('POST', '/v1/donations', data);
    }

    getDonation(id: string, params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
        return this.request('GET', `/v1/donations/${id}${qs}`);
    }

    listDonations(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
        return this.request('GET', `/v1/donations${qs}`);
    }

    // -- Donors ---------------------------------------------------------------

    createDonor(data: Record<string, unknown>) {
        return this.request('POST', '/v1/donors', data);
    }

    getDonor(search: string) {
        return this.request('GET', `/v1/donors/${search}`);
    }

    listDonors() {
        return this.request('GET', '/v1/donors');
    }

    // -- Intents (public, no auth) --------------------------------------------

    createIntent(donationConfig: Record<string, unknown>) {
        return this.request(
            'POST',
            '/v1/donations/create-intent',
            donationConfig,
            false,
        );
    }
}

/** Pre-configured client using default test fixtures. */
export const api = new TestAPIClient(BASE_URL, API_KEY);
