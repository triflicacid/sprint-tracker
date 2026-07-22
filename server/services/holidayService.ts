import { db } from "../db/connection.js";

/**
 * lists holidays in a date range.
 *
 * @param start - inclusive start date.
 * @param end - inclusive end date.
 * @returns matching holiday dates in ascending order.
 */
export function listHolidaysInRange(start: string, end: string): string[] {
    const rows = db
        .prepare("SELECT date FROM holidays WHERE date >= ? AND date <= ? ORDER BY date")
        .all(start, end) as { date: string }[];
    return rows.map((row) => row.date);
}

/**
 * adds a holiday.
 *
 * @param date - holiday date to add.
 */
export function addHoliday(date: string): void {
    db.prepare("INSERT OR IGNORE INTO holidays (date) VALUES (?)").run(date);
}

/**
 * removes a holiday.
 *
 * @param date - holiday date to remove.
 */
export function removeHoliday(date: string): void {
    db.prepare("DELETE FROM holidays WHERE date = ?").run(date);
}
