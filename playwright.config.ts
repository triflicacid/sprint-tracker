import { defineConfig, devices } from "@playwright/test";
import { E2E_DB_PATH, E2E_API_PORT, E2E_CLIENT_PORT } from "./e2e/testDbPath.js";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: "list",
    globalSetup: "./e2e/global-setup.ts",
    globalTeardown: "./e2e/global-teardown.ts",
    use: {
        baseURL: `http://localhost:${E2E_CLIENT_PORT}`,
        trace: "retain-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: [
        {
            command: "npx tsx server/index.ts",
            url: `http://localhost:${E2E_API_PORT}/api/sprints`,
            reuseExistingServer: false,
            env: { DB_PATH: E2E_DB_PATH, PORT: String(E2E_API_PORT) },
            stdout: "pipe",
        },
        {
            command: `npx vite --port ${E2E_CLIENT_PORT} --strictPort`,
            url: `http://localhost:${E2E_CLIENT_PORT}`,
            reuseExistingServer: false,
            env: { VITE_API_PROXY_TARGET: `http://localhost:${E2E_API_PORT}` },
            stdout: "pipe",
        },
    ],
});
