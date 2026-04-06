import * as schema from '@db/schema';
import { connect } from '@planetscale/database';
import { drizzle } from 'drizzle-orm/planetscale-serverless';

if (!process.env.DATABASE_URL) {
    throw new Error('Please set the DATABASE_URL environment variable');
}

const connection = connect({
    url: process.env.DATABASE_URL as string,
});

export const db = drizzle(connection, {
    schema,
});
