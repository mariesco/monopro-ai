import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { getDB } from '../../../shared/utils/Database.js';
import { migrateDB } from '../../../shared/utils/migrateDatabase.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

let mockDB: NeonHttpDatabase<Record<string, never>>;

export const setup = async () => {
  dotenv.config();
  const NEON_TEST_URL = process.env.NEON_TEST_URL!;
  await migrateDB(NEON_TEST_URL);
  mockDB = getDB(NEON_TEST_URL);
  return mockDB;
};

export const teardown = async () => {
  await mockDB.execute(sql`drop schema if exists public cascade`);
  await mockDB.execute(sql`create schema public`);
  await mockDB.execute(sql`drop schema if exists drizzle cascade`);
};
