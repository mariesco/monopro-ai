import { drizzle } from 'drizzle-orm/neon-http';
import { migrate as drizzleMigrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

export async function migrateDB(neonUrl: string) {
  const sql = neon(neonUrl);
  const db = drizzle(sql);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  function findMigrationsFolder(startDir: string): string {
    const possiblePaths = [
      path.join(startDir, 'drizzle_migrations'),
      path.join(startDir, 'packages', 'core', 'drizzle_migrations'),
      path.join(startDir, '..', 'drizzle_migrations'),
      path.join(startDir, '..', '..', 'drizzle_migrations'),
      path.join(startDir, '..', '..', '..', 'drizzle_migrations'),
      path.join(startDir, '..', '..', '..', '..', 'drizzle_migrations'),
      path.join(startDir, '..', '..', '..', '..', '..', 'drizzle_migrations'),
    ];

    for (const folderPath of possiblePaths) {
      if (fs.existsSync(folderPath)) {
        return folderPath;
      }
    }

    const parentDir = path.dirname(startDir);
    if (parentDir === startDir) {
      throw new Error('Cant found migrations folder');
    }
    return findMigrationsFolder(parentDir);
  }

  const migrationsFolder = findMigrationsFolder(__dirname);

  console.log('Migrations folder:', migrationsFolder);

  try {
    await drizzleMigrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}
