import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const sharedAlias = {
    "@shared": path.resolve(__dirname, "shared"),
    "#api": path.resolve(__dirname, "src/api"),
    "#components": path.resolve(__dirname, "src/components"),
    "#pages": path.resolve(__dirname, "src/pages"),
    "#utils": path.resolve(__dirname, "src/utils"),
    "#testUtils": path.resolve(__dirname, "src/testUtils"),
    "#styles": path.resolve(__dirname, "src/styles"),
};

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: "server-integration",
                    include: ["server/tests/integration/**/*.test.ts"],
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
                    name: "client-integration",
                    include: ["src/tests/integration/**/*.test.tsx"],
                    environment: "jsdom",
                    setupFiles: ["src/testUtils/setupTests.ts"],
                },
            },
        ],
    },
});
