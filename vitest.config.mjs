import path from 'node:path';
import { defineConfig } from 'vitest/config';

const TEST_DB = 'postgresql://embassy:embassy@localhost:5434/embassy_test';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globalSetup: ['tests/global-setup.mjs'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DB,
      APP_URL: 'http://localhost:3000',
      APP_SECRET: 'test-secret-test-secret-test-secret-0123456789',
      STRIPE_SECRET_KEY: 'sk_test_unit_tests_only',
      STRIPE_WEBHOOK_SECRET: 'whsec_unit_test_secret',
      EMAIL_TRANSPORT: 'test',
      STORAGE_DRIVER: process.env.TEST_STORAGE_DRIVER || 'local',
      LOCAL_STORAGE_DIR: '.test-storage',
    },
  },
});
