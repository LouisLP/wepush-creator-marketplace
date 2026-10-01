import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['apps/*/src/**', 'packages/*/src/**'],
      exclude: ['**/*.test.ts', '**/testing/**'],
    },
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['packages/*/src/**/*.test.ts', 'apps/{api,worker}/src/**/*.test.ts'],
          exclude: ['**/*.int.test.ts', '**/node_modules/**'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: ['**/*.int.test.ts'],
          exclude: ['**/node_modules/**'],
          globalSetup: ['packages/db/src/testing/global-setup.ts'],
          fileParallelism: false,
        },
      },
      {
        extends: './apps/web/vite.config.ts',
        root: './apps/web',
        test: {
          name: 'web',
          environment: 'happy-dom',
          include: ['src/**/*.test.ts'],
        },
      },
    ],
  },
})
