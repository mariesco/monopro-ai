import { vi } from 'vitest';

vi.mock('../../../shared/utils/Database.js', async (importOriginal) => {
  const { neon } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-http');
  const client = neon(process.env.NEON_TEST_URL!);
  const db = drizzle(client);
  return {
    ...(await importOriginal<
      typeof import('../../../shared/utils/Database.js')
    >()),
    getDB: (neonUrl: string) => db,
  };
});
