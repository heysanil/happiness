import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';

test.describe
    .serial('Presets API', () => {
        let pageId: string;

        const tierPresets = [
            {
                amount: 1000,
                name: 'Supporter',
                description: 'Help us keep the lights on',
            },
            {
                amount: 5000,
                name: 'Champion',
                description: "Fund a student's tuition",
            },
            {
                amount: 25000,
                name: 'Patron',
                description: 'Full scholarship for a semester',
            },
        ];

        const gridPresets = [
            { amount: 500 },
            { amount: 1500 },
            { amount: 3000 },
        ];

        test('POST /v1/pages — creates a page with tier presets', async () => {
            const { status, data } = await api.createPage({
                slug: 'e2e-presets-tier',
                kind: 'simple',
                name: 'Presets Tier Test',
                title: 'Presets Tier Fundraiser',
                status: 'published',
                presets: tierPresets,
            });

            expect(status).toBe(201);
            const page = data as Record<string, unknown>;
            expect(page).toHaveProperty('id');
            pageId = page.id as string;

            expect(page.presets).toEqual(tierPresets);
        });

        test('GET /v1/pages/{id} — returns presets in response', async () => {
            const { status, data } = await api.getPage(pageId);
            const page = data as Record<string, unknown>;

            expect(status).toBe(200);
            expect(page.presets).toEqual(tierPresets);
        });

        test('PATCH /v1/pages/{id} — updates presets with name and description', async () => {
            const newTierPresets = [
                {
                    amount: 2000,
                    name: 'Bronze',
                    description: 'Entry-level support',
                },
                {
                    amount: 10000,
                    name: 'Silver',
                    description: 'Mid-level support',
                },
            ];
            const { status, data } = await api.updatePage(pageId, {
                presets: newTierPresets,
            });
            const page = data as Record<string, unknown>;

            expect(status).toBe(200);
            expect(page.presets).toEqual(newTierPresets);
        });

        test('PATCH /v1/pages/{id} — updates presets to grid-only', async () => {
            const { status, data } = await api.updatePage(pageId, {
                presets: gridPresets,
            });
            const page = data as Record<string, unknown>;

            expect(status).toBe(200);
            expect(page.presets).toEqual(gridPresets);
        });

        test('GET /v1/pages/{id} — reflects updated grid presets', async () => {
            const { status, data } = await api.getPage(pageId);
            const page = data as Record<string, unknown>;

            expect(status).toBe(200);
            expect(page.presets).toEqual(gridPresets);
        });

        test('PATCH /v1/pages/{id} — clears presets with null', async () => {
            const { status, data } = await api.updatePage(pageId, {
                presets: null,
            });
            const page = data as Record<string, unknown>;

            expect(status).toBe(200);
            expect(page.presets).toBeNull();
        });

        test('DELETE /v1/pages/{id} — cleanup', async () => {
            const { status } = await api.deletePage(pageId);
            expect(status).toBe(204);
        });
    });
