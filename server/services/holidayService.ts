import { db } from "../db/connection.js";

export function listHolidaysInRange(start: string, end: string): string[] {
    const rows = db
        .prepare("SELECT date FROM holidays WHERE date >= ? AND date <= ? ORDER BY date")
        .all(start, end) as { date: string }[];
    return rows.map((row) => row.date);
}

export function addHoliday(date: string): void {
    db.prepare("INSERT OR IGNORE INTO holidays (date) VALUES (?)").run(date);
}

export function removeHoliday(date: string): void {
    db.prepare("DELETE FROM holidays WHERE date = ?").run(date);
}
