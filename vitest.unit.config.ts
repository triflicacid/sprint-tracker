import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const sharedAlias = { "@shared": path.resolve(__dirname, "shared") };

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: "server-unit",
                    include: ["server/**/*.test.ts"],
                    exclude: ["server/tests/integration/**", "node_modules/**"],
                    environment: "node",
                    setupFiles: ["server/testUtils/vitestSetup.ts"],
                    // each test file shares the same in-memory sqlite handle via
                    // server/db/connection.ts's module-level singleton; running files
                    // concurrently races resetDatabase() against other files' queries.
                    fileParallelism: false,
                },
            },
            {
                plugins: [react()],
                resolve: { alias: sharedAlias },
                test: {
                    name: "client-unit",
                    include: ["src/**/*.test.{ts,tsx}"],
                    exclude: ["src/tests/integration/**", "node_modules/**"],
                    environment: "jsdom",
                    setupFiles: ["src/testUtils/setupTests.ts"],
                },
            },
        ],
    },
});
