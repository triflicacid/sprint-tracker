import os from "os";
import path from "path";

// Unique per run, not a fixed name: Playwright's webServer starts before
// global-setup, so a fixed filename could already be locked by this run's
// own server before cleanup runs. Still never the real
// data/sprint-tracker.sqlite3.
export const E2E_DB_PATH: string = path.join(os.tmpdir(), `sprint-tracker-e2e-${Date.now()}.sqlite3`);
export const E2E_API_PORT = 4500;
export const E2E_CLIENT_PORT = 5175;
