import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../db/connection.js";

const currentDir: string = path.dirname(fileURLToPath(import.meta.url));
const schemaPath: string = path.join(currentDir, "..", "..", "data", "schema.sql");

/**
 * resets the test database to the current schema.
 */
export function resetDatabase() {
    const tables: string[] = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
        .all()
        .map((row) => (row as { name: string }).name);

    db.pragma("foreign_keys = OFF");
    const dropAll = db.transaction(() => {
        for (const table of tables) {
            db.exec(`DROP TABLE IF EXISTS "${table}"`);
        }
    });
    dropAll();
    db.pragma("foreign_keys = ON");

    db.exec(fs.readFileSync(schemaPath, "utf-8"));
}
