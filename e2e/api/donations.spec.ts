import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';
import {
    BASE_URL,
    SIMPLE_PAGE_ID,
    TEST_DONATION_ID,
} from '../helpers/fixtures';

test.describe('Donations API', () => {
    test('GET /v1/donations with auth — returns array', async () => {
        const { status, data } = await api.listDonations();

        expect(status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
    });

    test('GET /v1/donations without auth — returns 401', async () => {
        const res = await fetch(`${BASE_URL}/v1/donations`);

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.status).toBe(401);
        expect(body.message).toBe('Unauthorized');
    });

    test('POST /v1/donations — create donation', async () => {
        const { status, data } = await api.createDonation({
            donation: {
                pageID: SIMPLE_PAGE_ID,
                amount: 5000,
                visible: true,
                message: 'API test',
            },
            donor: {
                firstName: 'API',
                lastName: 'Test',
                email: 'api-test@test.local',
            },
        });

        expect(status).toBe(201);
        expect(data).toBeTruthy();
    });

    test('GET /v1/donations/{id} — get seeded donation by ID', async () => {
        const { status, data } = await api.getDonation(TEST_DONATION_ID);
        const donation = data as Record<string, unknown>;

        expect(status).toBe(200);
        expect(donation.amount).toBe(5000);
    });

    test('GET /v1/donations?page={pageID} — filter by page', async () => {
        const { status, data } = await api.listDonations({
            page: SIMPLE_PAGE_ID,
        });

        expect(status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect((data as unknown[]).length).toBeGreaterThan(0);
    });

    test('POST /v1/donations/create-intent — one-time donation', async () => {
        const { status, data } = await api.createIntent({
            amount: 2500,
            frequency: 'One-time',
            coverFees: false,
            anonymous: false,
            projectName: 'Test',
            pageID: SIMPLE_PAGE_ID,
            tipPercent: 0,
            email: 'intent-test@test.local',
            donorName: 'Intent Test',
        });
        const result = data as Record<string, unknown>;

        expect(status).toBe(200);
        expect(result.clientSecret).toBeTruthy();
        expect(result.donationID).toBeTruthy();
    });

    test('POST /v1/donations/create-intent — monthly donation', async () => {
        const { status, data } = await api.createIntent({
            amount: 2500,
            frequency: 'Monthly',
            coverFees: false,
            anonymous: false,
            projectName: 'Test',
            pageID: SIMPLE_PAGE_ID,
            tipPercent: 0,
            email: 'intent-monthly@test.local',
            donorName: 'Intent Monthly',
        });
        const result = data as Record<string, unknown>;

        expect(status).toBe(200);
        expect(result.clientSecret).toBeTruthy();
        expect(result.donationID).toBeTruthy();
    });
});
