// ---------------------------------------------------------------------------
// Playwright global setup — runs once before all E2E test suites
// ---------------------------------------------------------------------------

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

import {
    SIMPLE_PAGE_ID,
    SIMPLE_PAGE_SLUG,
    STORY_PAGE_ID,
    STORY_PAGE_SLUG,
    TEST_DONATION_ID,
    TEST_DONOR_EMAIL,
    TEST_DONOR_FIRST,
    TEST_DONOR_ID,
    TEST_DONOR_LAST,
} from './helpers/fixtures';

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function retry<T>(
    fn: () => Promise<T>,
    label: string,
    maxMs = 30_000,
    intervalMs = 1_000,
): Promise<T> {
    const deadline = Date.now() + maxMs;
    let lastError: unknown;
    while (Date.now() < deadline) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            await new Promise((r) => setTimeout(r, intervalMs));
        }
    }
    throw new Error(
        `${label} did not become ready within ${maxMs / 1000}s: ${lastError}`,
    );
}

// ---------------------------------------------------------------------------
// Health checks
// ---------------------------------------------------------------------------

async function checkMySQL() {
    const mysql = await import('mysql2/promise');
    const pool = mysql.createPool(process.env.DATABASE_URL!);
    await pool.query('SELECT 1');
    await pool.end();
}

async function checkMailPit() {
    const res = await fetch(
        `${process.env.MAILPIT_URL || 'http://localhost:8025'}/api/v1/messages`,
    );
    if (!res.ok) throw new Error(`MailPit returned ${res.status}`);
}

async function checkRedis() {
    const { default: Redis } = await import('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6380';
    const redis = new Redis(redisUrl);
    await redis.ping();
    await redis.quit();
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

async function seedTestData() {
    const mysql = await import('mysql2/promise');
    const pool = mysql.createPool(process.env.DATABASE_URL!);

    const prefix = process.env.DATABASE_TABLE_PREFIX || 'happiness';

    // Insert test pages
    await pool.query(
        `INSERT INTO \`${prefix}_pages\` (id, slug, kind, name, title, subtitle, story, status, organizer, goal, raised, goal_currency)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE slug = VALUES(slug)`,
        [
            SIMPLE_PAGE_ID,
            SIMPLE_PAGE_SLUG,
            'simple',
            'E2E Simple Page',
            'E2E Simple Fundraiser',
            'A simple test page for E2E',
            null,
            'published',
            'E2E Organizer',
            500000, // $5,000 goal in cents
            100000, // $1,000 raised
            'usd',
        ],
    );

    await pool.query(
        `INSERT INTO \`${prefix}_pages\` (id, slug, kind, name, title, subtitle, story, status, organizer, goal, raised, goal_currency)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE slug = VALUES(slug)`,
        [
            STORY_PAGE_ID,
            STORY_PAGE_SLUG,
            'story',
            'E2E Story Page',
            'E2E Story Fundraiser',
            'A story test page for E2E',
            '# Our Story\n\nThis is a test story page used by E2E tests.',
            'published',
            'E2E Organizer',
            1000000, // $10,000 goal
            250000, // $2,500 raised
            'usd',
        ],
    );

    // Insert test donor
    await pool.query(
        `INSERT INTO \`${prefix}_donors\` (id, first_name, last_name, email)
		 VALUES (?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE email = VALUES(email)`,
        [TEST_DONOR_ID, TEST_DONOR_FIRST, TEST_DONOR_LAST, TEST_DONOR_EMAIL],
    );

    // Insert test donation linked to simple page and donor
    await pool.query(
        `INSERT INTO \`${prefix}_donations\` (id, page_id, donor_id, amount, amount_currency, fee, fee_currency, fee_covered, tip_amount, visible, message, external_transaction_provider, external_transaction_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE id = VALUES(id)`,
        [
            TEST_DONATION_ID,
            SIMPLE_PAGE_ID,
            TEST_DONOR_ID,
            5000, // $50.00
            'usd',
            150, // $1.50 fee
            'usd',
            false,
            0,
            true,
            'E2E test donation',
            'stripe',
            'pi_e2e_test_seed_001',
        ],
    );

    await pool.end();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default async function globalSetup(_config: FullConfig) {
    console.log('[e2e] Global setup starting...');

    // 1. Health-check Docker services
    console.log('[e2e] Checking MySQL...');
    await retry(checkMySQL, 'MySQL');

    console.log('[e2e] Checking MailPit...');
    await retry(checkMailPit, 'MailPit');

    console.log('[e2e] Checking Redis...');
    await retry(checkRedis, 'Redis');

    console.log('[e2e] All services healthy.');

    // 2. Push Drizzle schema to test database
    console.log('[e2e] Pushing Drizzle schema...');
    // Note: execSync is used intentionally here with static commands — no user input.
    execSync('bunx drizzle-kit push:mysql --config ./drizzle.config.ts', {
        stdio: 'inherit',
        env: { ...process.env },
    });

    // 3. Seed test data
    console.log('[e2e] Seeding test data...');
    await seedTestData();

    // 4. Build is handled by the webServer command in playwright.config.ts
    // (e.g. `bun run build && bun run start`). This ensures the .next
    // directory is fresh when `next start` reads it, avoiding stale static
    // assets that would cause "Application error: a client-side exception".

    // 5. Write seeded IDs to disk for reference
    const testDataPath = path.join(__dirname, '.test-data.json');
    fs.writeFileSync(
        testDataPath,
        JSON.stringify(
            {
                pages: {
                    simple: { id: SIMPLE_PAGE_ID, slug: SIMPLE_PAGE_SLUG },
                    story: { id: STORY_PAGE_ID, slug: STORY_PAGE_SLUG },
                },
                donor: {
                    id: TEST_DONOR_ID,
                    email: TEST_DONOR_EMAIL,
                    firstName: TEST_DONOR_FIRST,
                    lastName: TEST_DONOR_LAST,
                },
                donation: {
                    id: TEST_DONATION_ID,
                    pageId: SIMPLE_PAGE_ID,
                    donorId: TEST_DONOR_ID,
                },
            },
            null,
            2,
        ),
    );

    console.log('[e2e] Global setup complete.');
}
