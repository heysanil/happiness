import { expect, test } from '@playwright/test';
import { api } from '../helpers/api-client';
import {
    BASE_URL,
    SIMPLE_PAGE_SLUG,
    STORY_PAGE_SLUG,
} from '../helpers/fixtures';

test.describe
    .serial('Pages API', () => {
        let tempPageId: string;

        test('GET /v1/pages — returns list including seeded pages', async () => {
            const { status, data } = await api.listPages();

            expect(status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
            expect((data as unknown[]).length).toBeGreaterThan(0);
        });

        test('POST /v1/pages — creates a new page', async () => {
            const { status, data } = await api.createPage({
                slug: 'e2e-temp-page',
                kind: 'simple',
                name: 'Temp Page',
                title: 'Temporary',
                status: 'published',
            });

            expect(status).toBe(201);
            expect(data).toHaveProperty('id');
            tempPageId = (data as Record<string, string>).id;
            expect(tempPageId).toBeTruthy();
        });

        test('POST /v1/pages without auth — returns 401', async () => {
            const res = await fetch(`${BASE_URL}/v1/pages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: 'no-auth-page',
                    kind: 'simple',
                    name: 'No Auth',
                    title: 'Should Fail',
                    status: 'published',
                }),
            });

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.status).toBe(401);
            expect(body.message).toBe('Unauthorized');
        });

        test('GET /v1/pages/{slug} — get seeded simple page by slug', async () => {
            const { status, data } = await api.getPage(SIMPLE_PAGE_SLUG);
            const page = data as Record<string, unknown>;

            expect(status).toBe(200);
            expect(page.name).toBe('E2E Simple Page');
            expect(page.title).toBe('E2E Simple Fundraiser');
            expect(page.kind).toBe('simple');
        });

        test('GET /v1/pages/{slug} — get seeded story page by slug', async () => {
            const { status, data } = await api.getPage(STORY_PAGE_SLUG);
            const page = data as Record<string, unknown>;

            expect(status).toBe(200);
            expect(page.kind).toBe('story');
        });

        test('PATCH /v1/pages/{id} — update the temp page title', async () => {
            const { status, data } = await api.updatePage(tempPageId, {
                title: 'Updated Temporary Title',
            });
            const page = data as Record<string, unknown>;

            expect(status).toBe(200);
            expect(page.title).toBe('Updated Temporary Title');
        });

        test('DELETE /v1/pages/{id} — delete the temp page', async () => {
            const { status } = await api.deletePage(tempPageId);

            expect(status).toBe(204);
        });

        test('GET /v1/pages/{id} after delete — returns 404', async () => {
            const { status } = await api.getPage(tempPageId);

            expect(status).toBe(404);
        });
    });
