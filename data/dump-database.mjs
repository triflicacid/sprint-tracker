// dumps every row in the database into a sql file of insert statements.
// with no argument, the output file is written to data/dump_<timestamp>.sql.
// set DB_PATH to point at a different database file if needed.

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(currentDir, "sprint-tracker.sqlite3");

// dumped in an order that satisfies foreign key constraints on restore.
const tablesInDumpOrder = [
    "sprints",
    "stories",
    "subtasks",
    "tags",
    "entity_tags",
    "status_history",
    "holidays",
];

function formatValue(value) {
    if (value === null || value === undefined) {
        return "NULL";
    }
    if (typeof value === "number") {
        return String(value);
    }
    // strings and anything else get single-quoted, with quotes escaped.
    return `'${String(value).replace(/'/g, "''")}'`;
}

function dumpTable(db, tableName) {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) {
        return [];
    }
    const columns = Object.keys(rows[0]);
    const statements = [];
    for (const row of rows) {
        const values = columns.map((column) => formatValue(row[column]));
        statements.push(
            `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});`
        );
    }
    return statements;
}

function resolveOutputPath(requestedFile) {
    if (requestedFile) {
        return requestedFile.includes(path.sep) ? path.resolve(requestedFile) : path.join(currentDir, requestedFile);
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return path.join(currentDir, `dump_${timestamp}.sql`);
}

const outputPath = resolveOutputPath(process.argv[2]);
const db = new Database(dbPath, { readonly: true });

const lines = [`-- dump of ${dbPath}, generated ${new Date().toISOString()}`, ""];
for (const table of tablesInDumpOrder) {
    const statements = dumpTable(db, table);
    if (statements.length === 0) {
        continue;
    }
    lines.push(`-- ${table}`);
    lines.push(...statements);
    lines.push("");
}

db.close();
fs.writeFileSync(outputPath, lines.join("\n"));

console.log(`dumped ${dbPath} to ${outputPath}`);
