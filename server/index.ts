import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * finds the repo root from a starting directory.
 *
 * @param startDir - directory to start searching from.
 * @returns the repo root when found.
 */
function findRepoRoot(startDir: string): string | undefined {
    let dir = startDir;
    while (true) {
        if (fs.existsSync(path.join(dir, "package.json"))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            return undefined;
        }
        dir = parent;
    }
}

// keep key paths stable across launch locations
const repoRoot = findRepoRoot(__dirname);
if (repoRoot) {
    process.env.DATA_DIR ??= path.join(repoRoot, "data");
    process.env.CLIENT_DIST_PATH ??= path.join(repoRoot, "dist", "client");
}

const { initSchema } = await import("./db/connection.js");
const { createApp } = await import("./app.js");

initSchema();

const app = createApp();

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
    console.log(`sprint tracker server listening on port ${port}`);
});
