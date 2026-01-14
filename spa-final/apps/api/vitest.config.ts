import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/__tests__/**',
        '**/*.d.ts',
        'src/cron/**',
        'src/services/email.ts',
        'src/services/sms.ts',
        'src/services/payments.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    isolate: true,
    sequence: {
      hooks: 'list',
    },
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
