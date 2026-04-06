import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';
import {
    BASE_URL,
    TEST_DONOR_EMAIL,
    TEST_DONOR_FIRST,
    TEST_DONOR_ID,
} from '../helpers/fixtures';

test.describe('Donors API', () => {
    test('GET /v1/donors with auth — returns array', async () => {
        const { status, data } = await api.listDonors();

        expect(status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
    });

    test('GET /v1/donors without auth — returns 401', async () => {
        const res = await fetch(`${BASE_URL}/v1/donors`);

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.status).toBe(401);
        expect(body.message).toBe('Unauthorized');
    });

    test('POST /v1/donors — create donor', async () => {
        const { status, data } = await api.createDonor({
            firstName: 'New',
            lastName: 'Donor',
            email: 'new-donor@test.local',
        });

        expect(status).toBe(201);
        expect(data).toBeTruthy();
    });

    test('GET /v1/donors/{email} — find seeded donor by email', async () => {
        const { status, data } = await api.getDonor(TEST_DONOR_EMAIL);
        const donor = data as Record<string, unknown>;

        expect(status).toBe(200);
        expect(donor.firstName).toBe(TEST_DONOR_FIRST);
    });

    test('GET /v1/donors/{id} — find seeded donor by ID', async () => {
        const { status, data } = await api.getDonor(TEST_DONOR_ID);
        const donor = data as Record<string, unknown>;

        expect(status).toBe(200);
        expect(donor.email).toBe(TEST_DONOR_EMAIL);
    });
});
