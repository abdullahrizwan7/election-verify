import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests click through the real app in a browser.
 * They expect demo mode (no DATABASE_URL or Supabase keys in .env).
 *
 * npm run test:e2e                                         builds and starts the app on port 3200
 * PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e   uses an app that is already running
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3200";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: "npm run build && npm run start -- -p 3200", url: baseURL, timeout: 180_000, reuseExistingServer: true },
});
