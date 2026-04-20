import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests hit the same dev servers you run locally.
 *   pnpm --filter api dev    → http://localhost:5001
 *   pnpm --filter web dev    → http://localhost:5173
 *
 * The web server is launched automatically via webServer below. The
 * API + MongoDB are expected to already be running — tests will fail
 * fast if the proxy target returns a non-2xx on /health.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm --filter web dev",
        port: 5173,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
