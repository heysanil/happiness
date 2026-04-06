// ---------------------------------------------------------------------------
// Playwright global teardown — runs once after all E2E test suites
// ---------------------------------------------------------------------------

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default async function globalTeardown(_config: FullConfig) {
    console.log('[e2e] Global teardown starting...');

    const prefix = process.env.DATABASE_TABLE_PREFIX || 'happiness';

    // 1. Truncate all test tables in MySQL
    try {
        const mysql = await import('mysql2/promise');
        const pool = mysql.createPool(process.env.DATABASE_URL!);

        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query(`TRUNCATE \`${prefix}_pages\``);
        await pool.query(`TRUNCATE \`${prefix}_pages_deleted\``);
        await pool.query(`TRUNCATE \`${prefix}_donations\``);
        await pool.query(`TRUNCATE \`${prefix}_donations_deleted\``);
        await pool.query(`TRUNCATE \`${prefix}_donors\``);
        await pool.query(`TRUNCATE \`${prefix}_donors_deleted\``);
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        await pool.end();
        console.log('[e2e] MySQL tables truncated.');
    } catch (err) {
        console.error('[e2e] Failed to truncate MySQL tables:', err);
    }

    // 2. Flush Redis
    try {
        const { default: Redis } = await import('ioredis');
        const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6380';
        const redis = new Redis(redisUrl);
        await redis.flushdb();
        await redis.quit();
        console.log('[e2e] Redis flushed.');
    } catch (err) {
        console.error('[e2e] Failed to flush Redis:', err);
    }

    // 3. Clear MailPit mailbox
    try {
        await fetch('http://localhost:8025/api/v1/messages', {
            method: 'DELETE',
        });
        console.log('[e2e] MailPit mailbox cleared.');
    } catch (err) {
        console.error('[e2e] Failed to clear MailPit:', err);
    }

    // 4. Clean up any saved auth state files
    const authState = path.join(__dirname, '.dashboard-auth-state.json');
    if (fs.existsSync(authState)) fs.unlinkSync(authState);

    console.log('[e2e] Global teardown complete.');
}
