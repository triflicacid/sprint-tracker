// applies the schema, then runs a sql file against the database.
// a filename with no directory separators is looked up inside data/.
// set DB_PATH to point at a different database file if needed.

import "dotenv/config";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(currentDir, "sprint-tracker.sqlite3");

const requestedFile = process.argv[2];
if (!requestedFile) {
    console.error("usage: node run-sql-file.mjs <file.sql>");
    process.exit(1);
}

const sqlPath = requestedFile.includes(path.sep)
    ? path.resolve(requestedFile)
    : path.join(currentDir, requestedFile);

if (!fs.existsSync(sqlPath)) {
    console.error(`sql file not found: ${sqlPath}`);
    process.exit(1);
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

const schemaPath = path.join(currentDir, "schema.sql");
db.exec(fs.readFileSync(schemaPath, "utf-8"));

const sql = fs.readFileSync(sqlPath, "utf-8");
db.exec(sql);
db.close();

console.log(`ran ${sqlPath} against ${dbPath}`);
