import { drizzle } from 'drizzle-orm/neon-http';
import { migrate as drizzleMigrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';
import path from 'path';
import { fileURLToPath } from 'url';

export async function migrateDB(neonUrl: string) {
  const sql = neon(neonUrl);
  const db = drizzle(sql);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const migrationsFolder = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'drizzle_migrations',
  );

  try {
    await drizzleMigrate(db, { migrationsFolder });
  } catch (error) {
    throw error;
  }
}
