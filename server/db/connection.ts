import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

/**
 * resolves the sqlite database path.
 *
 * @returns database file path.
 */
function resolveDbPath() {
    return process.env.DB_PATH ?? path.join(dataDir, "sprint-tracker.sqlite3");
}

const dbPath = resolveDbPath();
export const db: Database.Database = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/**
 * applies the database schema.
 */
export function initSchema(): void {
    const schemaPath = path.join(dataDir, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    db.exec(schema);
}
