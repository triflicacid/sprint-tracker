import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

// DB_PATH overrides this for Electron's user-data dir and for tests.
function resolveDbPath() {
    return process.env.DB_PATH ?? path.join(dataDir, "sprint-tracker.sqlite3");
}

const dbPath = resolveDbPath();
export const db: Database.Database = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// run schema to ensure tables are present
export function initSchema(): void {
    const schemaPath = path.join(dataDir, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    db.exec(schema);
}
