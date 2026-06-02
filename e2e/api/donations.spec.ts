import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';
import {
    ANON_DONATION_ID,
    ANON_DONOR_EMAIL,
    ANON_DONOR_FIRST,
    BASE_URL,
    SIMPLE_PAGE_ID,
    TEST_DONATION_ID,
    TEST_DONOR_EMAIL,
} from '../helpers/fixtures';

type DonationRow = {
    id: string;
    amount: number;
    donor?: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        email: string | null;
        phone: string | null;
        anonymous: boolean;
    };
    page?: { id: string };
};

const findByID = (rows: unknown, id: string): DonationRow | undefined =>
    (rows as DonationRow[]).find((d) => d.id === id);

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

    test('GET /v1/donations?include=donor&redactAnonymous=true — redacts anonymous PII, keeps non-anonymous', async () => {
        const { status, data } = await api.listDonations({
            include: 'donor',
            page: SIMPLE_PAGE_ID,
            redactAnonymous: 'true',
        });
        expect(status).toBe(200);

        const anon = findByID(data, ANON_DONATION_ID);
        expect(anon).toBeTruthy();
        // Anonymous donor's PII is nulled at the DB layer...
        expect(anon?.donor?.anonymous).toBe(true);
        expect(anon?.donor?.firstName).toBeNull();
        expect(anon?.donor?.lastName).toBeNull();
        expect(anon?.donor?.company).toBeNull();
        expect(anon?.donor?.email).toBeNull();
        expect(anon?.donor?.phone).toBeNull();
        // ...but the donation row itself is intact.
        expect(anon?.amount).toBe(2500);

        // The non-anonymous donor's PII is still returned.
        const regular = findByID(data, TEST_DONATION_ID);
        expect(regular?.donor?.anonymous).toBe(false);
        expect(regular?.donor?.email).toBe(TEST_DONOR_EMAIL);
        expect(regular?.donor?.firstName).toBeTruthy();

        // The redacted PII must not leak anywhere in the payload.
        const raw = JSON.stringify(data);
        expect(raw).not.toContain(ANON_DONOR_EMAIL);
        expect(raw).not.toContain(ANON_DONOR_FIRST);
    });

    test('GET /v1/donations?include=donor (no redactAnonymous) — anonymous PII returned (default unchanged)', async () => {
        const { status, data } = await api.listDonations({
            include: 'donor',
            page: SIMPLE_PAGE_ID,
        });
        expect(status).toBe(200);

        const anon = findByID(data, ANON_DONATION_ID);
        expect(anon?.donor?.anonymous).toBe(true);
        expect(anon?.donor?.email).toBe(ANON_DONOR_EMAIL);
        expect(anon?.donor?.firstName).toBe(ANON_DONOR_FIRST);
    });

    test('GET /v1/donations?include=donor,page&redactAnonymous=true — page still included', async () => {
        const { status, data } = await api.listDonations({
            include: 'donor,page',
            page: SIMPLE_PAGE_ID,
            redactAnonymous: 'true',
        });
        expect(status).toBe(200);

        const anon = findByID(data, ANON_DONATION_ID);
        expect(anon?.donor?.firstName).toBeNull();
        expect(anon?.page?.id).toBe(SIMPLE_PAGE_ID);
    });
});
