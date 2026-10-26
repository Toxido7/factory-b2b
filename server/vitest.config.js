import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load the TEST environment before anything else
const { parsed = {} } = config({ path: '.env.test', quiet: true });

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    env: { ...parsed, BCRYPT_ROUNDS: '4' },
  },
});
