import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/core/services/__tests__/setupTests.ts'],
    globalSetup: './src/core/services/__tests__/globalSetup.ts',
  },
});
