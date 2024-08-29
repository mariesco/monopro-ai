import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/models/drizzle_schema.ts',
  out: './drizzle_migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEON_URL!,
  },
});
