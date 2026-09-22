// Playwright journeys (Phase 5 — validation readiness). Runs the real dev
// stack on scratch ports (:5001 API, :5174 client) with a dedicated E2E user
// so tester/dev data is never touched. Not part of `npm run test`.
const { defineConfig } = require('@playwright/test')

const API_URL = 'http://localhost:5001'
const WEB_URL = 'http://localhost:5174'

module.exports = defineConfig({
  testDir: './journeys',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
  },
  globalSetup: require.resolve('./global-setup.cjs'),
  globalTeardown: require.resolve('./global-teardown.cjs'),
  webServer: [
    {
      command: 'npm run dev --workspace=server',
      url: `${API_URL}/api/health`,
      timeout: 120000,
      reuseExistingServer: false,
      env: {
        PORT: '5001',
        // Exact-origin CORS: the E2E client runs on :5174, not the dev :5173.
        CLIENT_ORIGIN: 'http://localhost:5174',
        DEV_AUTH_BYPASS: 'true',
        DEV_USER_ID: 'e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2',
      },
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      cwd: '../client',
      url: WEB_URL,
      timeout: 120000,
      reuseExistingServer: false,
      env: {
        VITE_API_URL: `${API_URL}/api`,
      },
    },
  ],
})
