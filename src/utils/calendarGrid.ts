export function parseIsoDate(dateString: string): Date {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

export function formatIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

// formats an iso date string (yyyy-mm-dd) for display as dd/mm/yyyy.
export function formatDisplayDate(dateString: string): string {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}

// monday-first grid of a single calendar month, padded with nulls so
// every row has 7 cells.
export function buildMonthGrid(year: number, month: number): (Date | null)[][] {
    const firstDay: Date = new Date(Date.UTC(year, month, 1));
    const daysInMonth: number = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const firstWeekday: number = (firstDay.getUTCDay() + 6) % 7;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) {
        cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(Date.UTC(year, month, day)));
    }
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
}

// monday-first grid of a single calendar month, like buildMonthGrid, but
// padding cells hold the real adjacent-month date instead of null - needed
// when content (e.g. a range-line) must be positioned by real date even in
// the leading/trailing days of a week that belong to the next/previous month.
export function buildMonthGridDates(year: number, month: number): Date[][] {
    const firstDay: Date = new Date(Date.UTC(year, month, 1));
    const daysInMonth: number = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const firstWeekday: number = (firstDay.getUTCDay() + 6) % 7;
    const totalCells: number = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    const cells: Date[] = [];
    for (let i = 0; i < totalCells; i++) {
        cells.push(new Date(Date.UTC(year, month, 1 - firstWeekday + i)));
    }

    const weeks: Date[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
}

export function isSameUtcMonth(date: Date, year: number, month: number): boolean {
    return date.getUTCFullYear() === year && date.getUTCMonth() === month;
}

// groups iso date strings into consecutive-day ranges, e.g.
// ["2026-07-12", "2026-07-13", "2026-07-14"] -> [{ start: "2026-07-12", end: "2026-07-14" }].
// input need not be pre-sorted.
export function groupConsecutiveDates(dates: string[]): { start: string; end: string }[] {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sorted: string[] = [...dates].sort();
    const groups: { start: string; end: string }[] = [];

    for (const date of sorted) {
        const current = groups[groups.length - 1];
        if (current && parseIsoDate(current.end).getTime() + oneDayMs === parseIsoDate(date).getTime()) {
            current.end = date;
        } else {
            groups.push({ start: date, end: date });
        }
    }

    return groups;
}

// every {year, month} spanned between two iso date strings, inclusive.
export function monthsBetween(startDate: string, endDate: string): { year: number; month: number }[] {
    const start: Date = parseIsoDate(startDate);
    const end: Date = parseIsoDate(endDate);
    const months: { year: number; month: number }[] = [];
    for (
        let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
        cursor <= end;
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
    ) {
        months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() });
    }
    return months;
}
