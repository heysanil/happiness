import { defineConfig, devices } from '@playwright/test';

// Port/base URL are overridable so tests can run alongside other local
// apps occupying 3000 (e.g. E2E_BASE_URL=http://localhost:3010).
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const port = Number(new URL(baseURL).port) || 3000;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['html']] : 'html',
    timeout: 60_000,
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    globalSetup: './e2e/global-setup.ts',
    globalTeardown: './e2e/global-teardown.ts',
    webServer: {
        command: 'bun run build && bun run start',
        port,
        env: { ...(process.env as Record<string, string>), PORT: String(port) },
        timeout: 300_000,
        reuseExistingServer: !process.env.CI,
    },
});
