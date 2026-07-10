import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Walks up from this file's own location to find the repo root (marked by
// package.json), rather than assuming a fixed number of ".." segments
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

// ensure location of key files is always correct, no matter the
// manner or location of execution
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
