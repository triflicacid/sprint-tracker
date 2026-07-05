import fs from "fs";
import { E2E_DB_PATH } from "./testDbPath.js";

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retries deletion: on Windows the file can stay briefly locked after
// Playwright kills the Express server. A leftover temp file is harmless
// (never the real data/sprint-tracker.sqlite3), so failure here is silent.
export default async function globalTeardown() {
    for (const suffix of ["", "-wal", "-shm"]) {
        const file = E2E_DB_PATH + suffix;
        for (let attempt = 0; attempt < 10; attempt++) {
            try {
                if (fs.existsSync(file)) {
                    fs.rmSync(file);
                }
                break;
            } catch {
                await sleep(300);
            }
        }
    }
}
