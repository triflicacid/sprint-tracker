// drops every table in the sprint tracker database.
// set DB_PATH to point at a different database file if needed.

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(currentDir, "sprint-tracker.sqlite3");

const db = new Database(dbPath);

const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((row) => row.name);

db.pragma("foreign_keys = OFF");
const dropAll = db.transaction(() => {
    for (const table of tables) {
        db.exec(`DROP TABLE IF EXISTS "${table}"`);
    }
});
dropAll();
db.pragma("foreign_keys = ON");

db.close();

console.log(`dropped ${tables.length} table(s)`);
