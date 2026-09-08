import { defineConfig, devices } from '@playwright/test';

if (!process.env.E2E_RUN_TOKEN || !process.env.E2E_RUNTIME_DIR || !process.env.E2E_BASE_URL) {
  throw new Error('Use npm run test:e2e para criar um runtime E2E isolado.');
}

const baseURL = process.env.E2E_BASE_URL;
const outputDir = process.env.E2E_OUTPUT_DIR;
const reportDir = process.env.E2E_REPORT_DIR;
const authState = process.env.E2E_DEFAULT_AUTH_STATE;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: reportDir, open: 'never' }]]
    : [['list'], ['html', { outputFolder: reportDir, open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authState,
      },
      dependencies: ['setup'],
    },
  ],
});
