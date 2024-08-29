import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const { NEON_URL } = process.env;
//TODO: Validate if all the env vars are set on the project installed

const sql = neon(`${NEON_URL}`);

export const db = drizzle(sql);
