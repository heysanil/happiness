import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';
import { BASE_URL, SIMPLE_PAGE_ID, STORY_PAGE_ID } from '../helpers/fixtures';

type PageStats = {
    raised: number;
    raisedSince: number;
    donationCount: number;
    donorCount: number;
};

type DonationsStats = {
    totals: PageStats;
    byPage: Record<string, PageStats>;
};

// A well-formed page ID that does not exist, used to assert that every
// requested page is represented in the response.
const ABSENT_PAGE_ID = 'pg_e2eabsent001';

test.describe('Donation stats API', () => {
    test('GET /v1/donations/stats without auth — returns 401', async () => {
        const res = await fetch(
            `${BASE_URL}/v1/donations/stats?pages=${SIMPLE_PAGE_ID}`,
        );

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.status).toBe(401);
    });

    test('GET /v1/donations/stats without pages — returns 400', async () => {
        const { status } = await api.getDonationsStats();

        expect(status).toBe(400);
    });

    test('GET /v1/donations/stats with a malformed page ID — returns 400', async () => {
        const { status } = await api.getDonationsStats({ pages: 'not-an-id' });

        expect(status).toBe(400);
    });

    test('GET /v1/donations/stats with an invalid since — returns 400', async () => {
        const { status } = await api.getDonationsStats({
            pages: SIMPLE_PAGE_ID,
            since: 'not-a-date',
        });

        expect(status).toBe(400);
    });

    test('GET /v1/donations/stats — aggregates the seeded page', async () => {
        const { status, data } = await api.getDonationsStats({
            pages: SIMPLE_PAGE_ID,
        });
        const stats = data as DonationsStats;

        expect(status).toBe(200);

        // Other specs create donations against this page, so assert the seeded
        // floor rather than an exact total: two seeded donations ($50 + $25)
        // from two distinct donors.
        expect(stats.totals.raised).toBeGreaterThanOrEqual(7500);
        expect(stats.totals.donationCount).toBeGreaterThanOrEqual(2);
        expect(stats.totals.donorCount).toBeGreaterThanOrEqual(2);
    });

    test('GET /v1/donations/stats — every requested page is present, absent pages report zeroes', async () => {
        const { status, data } = await api.getDonationsStats({
            pages: [SIMPLE_PAGE_ID, STORY_PAGE_ID, ABSENT_PAGE_ID].join(','),
        });
        const stats = data as DonationsStats;

        expect(status).toBe(200);
        expect(Object.keys(stats.byPage).sort()).toEqual(
            [SIMPLE_PAGE_ID, STORY_PAGE_ID, ABSENT_PAGE_ID].sort(),
        );
        expect(stats.byPage[ABSENT_PAGE_ID]).toEqual({
            raised: 0,
            raisedSince: 0,
            donationCount: 0,
            donorCount: 0,
        });
    });

    test('GET /v1/donations/stats — totals reconcile with the per-page breakdown', async () => {
        const { status, data } = await api.getDonationsStats({
            pages: [SIMPLE_PAGE_ID, STORY_PAGE_ID].join(','),
        });
        const stats = data as DonationsStats;

        expect(status).toBe(200);

        const pages = Object.values(stats.byPage);
        const sum = (pick: (p: PageStats) => number) =>
            pages.reduce((total, page) => total + pick(page), 0);

        // Amounts and donation counts are additive across pages.
        expect(stats.totals.raised).toBe(sum((p) => p.raised));
        expect(stats.totals.donationCount).toBe(sum((p) => p.donationCount));

        // Donor counts are not: the total is a distinct count over the whole
        // set, so it can only ever be at most the sum of the per-page counts.
        expect(stats.totals.donorCount).toBeLessThanOrEqual(
            sum((p) => p.donorCount),
        );
    });

    test('GET /v1/donations/stats — raised reconciles with the page raised amount', async () => {
        const [{ data: statsData }, { data: pageData }] = await Promise.all([
            api.getDonationsStats({ pages: SIMPLE_PAGE_ID }),
            api.getPage(SIMPLE_PAGE_ID),
        ]);

        const stats = statsData as DonationsStats;
        const page = pageData as { raised: number };

        // The stats endpoint and the single-page read must agree, otherwise the
        // per-fundraiser amounts shown in a list will not sum to the total.
        expect(stats.byPage[SIMPLE_PAGE_ID].raised).toBe(page.raised);
    });

    test('GET /v1/donations/stats — raisedSince is zero without a since, and for a future since', async () => {
        const { data: withoutSince } = await api.getDonationsStats({
            pages: SIMPLE_PAGE_ID,
        });
        expect((withoutSince as DonationsStats).totals.raisedSince).toBe(0);

        const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const { data: futureSince } = await api.getDonationsStats({
            pages: SIMPLE_PAGE_ID,
            since: future,
        });
        expect((futureSince as DonationsStats).totals.raisedSince).toBe(0);
    });

    test('GET /v1/donations/stats — a past since captures the full total', async () => {
        const { data } = await api.getDonationsStats({
            pages: SIMPLE_PAGE_ID,
            since: new Date(0).toISOString(),
        });
        const stats = data as DonationsStats;

        expect(stats.totals.raisedSince).toBe(stats.totals.raised);
    });

    test('GET /v1/donations/stats — excludes refunded donations', async () => {
        const { data: created, status: createStatus } =
            await api.createDonation({
                donation: {
                    pageID: STORY_PAGE_ID,
                    amount: 9900,
                    refunded: true,
                    visible: true,
                    message: 'E2E refunded donation',
                },
                donor: {
                    firstName: 'Refund',
                    lastName: 'Test',
                    email: 'e2e-refund-stats@test.local',
                },
            });

        expect(createStatus).toBe(201);
        expect(created).toBeTruthy();

        const { data } = await api.getDonationsStats({ pages: STORY_PAGE_ID });
        const stats = data as DonationsStats;

        // The refunded donation must not contribute to any figure.
        expect(stats.byPage[STORY_PAGE_ID].raised).toBe(0);
        expect(stats.byPage[STORY_PAGE_ID].donationCount).toBe(0);
        expect(stats.byPage[STORY_PAGE_ID].donorCount).toBe(0);
    });
});

test.describe('Pages API — ids filter', () => {
    test('GET /v1/pages?ids — restricts results to the requested pages', async () => {
        const { status, data } = await api.listPages({ ids: STORY_PAGE_ID });
        const pages = data as { id: string }[];

        expect(status).toBe(200);
        expect(pages.map((page) => page.id)).toEqual([STORY_PAGE_ID]);
    });

    test('GET /v1/pages?ids — accepts several IDs and ignores absent ones', async () => {
        const { status, data } = await api.listPages({
            ids: [SIMPLE_PAGE_ID, ABSENT_PAGE_ID].join(','),
        });
        const pages = data as { id: string }[];

        expect(status).toBe(200);
        expect(pages.map((page) => page.id)).toEqual([SIMPLE_PAGE_ID]);
    });

    test('GET /v1/pages?ids — malformed ID returns 400', async () => {
        const { status } = await api.listPages({ ids: 'not-an-id' });

        expect(status).toBe(400);
    });

    test('GET /v1/pages without ids — still returns every page', async () => {
        const { status, data } = await api.listPages();
        const pages = data as { id: string }[];

        expect(status).toBe(200);
        const ids = pages.map((page) => page.id);
        expect(ids).toContain(SIMPLE_PAGE_ID);
        expect(ids).toContain(STORY_PAGE_ID);
    });
});
