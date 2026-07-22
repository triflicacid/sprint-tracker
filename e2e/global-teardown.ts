import fs from "fs";
import { E2E_DB_PATH } from "./testDbPath.js";

/**
 * waits for a short interval between cleanup retries
 * @param ms delay in milliseconds
 * @returns promise that resolves after the delay
 */
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ensure test database is deleted
/**
 * removes per-run sqlite files after the e2e suite completes
 */
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
