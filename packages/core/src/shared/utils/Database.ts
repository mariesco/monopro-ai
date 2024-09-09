import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

export const getDB = (neonUrl: string) => {
  const sql = neon(neonUrl);
  return drizzle(sql);
};
