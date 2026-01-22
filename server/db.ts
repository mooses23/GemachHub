import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isProduction = process.env.NODE_ENV === 'production';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  max: isProduction ? 5 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
export { pool };
