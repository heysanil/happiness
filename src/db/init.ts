import * as schema from '@db/schema';
import { connect } from '@planetscale/database';
import { drizzle } from 'drizzle-orm/planetscale-serverless';

if (!process.env.DATABASE_URL) {
    throw new Error('Please set the DATABASE_URL environment variable');
}

// Default: PlanetScale serverless driver (used in production)
const defaultConnection = connect({
    url: process.env.DATABASE_URL as string,
});
const defaultDb = drizzle(defaultConnection, { schema });

function createDrizzleInstance(): typeof defaultDb {
    if (process.env.DATABASE_DRIVER === 'mysql2') {
        const mysql2 = require('mysql2/promise');

        const { drizzle: drizzleMysql2 } = require('drizzle-orm/mysql2');
        const pool = mysql2.createPool(process.env.DATABASE_URL as string);
        return drizzleMysql2(pool, { schema, mode: 'default' });
    }

    return defaultDb;
}

export const db = createDrizzleInstance();
