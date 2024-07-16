import type { Config } from 'drizzle-kit';
import { configDotenv } from 'dotenv';
import { HappinessConfig } from 'happiness.config';

configDotenv({
    path: '.env.local',
});

if (!process.env.DATABASE_URL) {
    throw new Error('Please set the DATABASE_URL environment variable');
}

export default {
    schema: 'src/db/schema.ts',
    out: './migrations',
    driver: 'mysql2',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL as string,
    },
    tablesFilter: [`${HappinessConfig.databaseTablePrefix}_*`],
} satisfies Config;
