import { describe, it, expect } from "vitest";
import {
    parseIsoDate,
    formatIsoDate,
    buildMonthGrid,
    buildMonthGridDates,
    isSameUtcMonth,
    monthsBetween,
} from "./calendarGrid";

describe("parseIsoDate / formatIsoDate", () => {
    it("round-trips an iso date string through UTC midnight", () => {
        const date = parseIsoDate("2026-03-16");
        expect(date.getUTCFullYear()).toBe(2026);
        expect(date.getUTCMonth()).toBe(2);
        expect(date.getUTCDate()).toBe(16);
        expect(formatIsoDate(date)).toBe("2026-03-16");
    });
});

describe("buildMonthGrid", () => {
    it("pads a month so every week has 7 cells, starting Monday", () => {
        // March 2026 starts on a Sunday
        const weeks = buildMonthGrid(2026, 2);
        expect(weeks[0]).toEqual([null, null, null, null, null, null, expect.any(Date)]);
        expect(weeks[0][6]?.getUTCDate()).toBe(1);
    });

    it("includes every day of the month exactly once", () => {
        const weeks = buildMonthGrid(2026, 2); // March has 31 days
        const days = weeks.flat().filter((d): d is Date => d !== null);
        expect(days).toHaveLength(31);
        expect(days[0].getUTCDate()).toBe(1);
        expect(days[days.length - 1].getUTCDate()).toBe(31);
    });

    it("pads trailing cells with null so the last week also has 7 cells", () => {
        const weeks = buildMonthGrid(2026, 2);
        expect(weeks[weeks.length - 1]).toHaveLength(7);
    });
});

describe("buildMonthGridDates", () => {
    it("fills leading/trailing padding with real adjacent-month dates instead of null", () => {
        const weeks = buildMonthGridDates(2026, 2); // March 2026
        const firstWeek = weeks[0];
        expect(firstWeek).toHaveLength(7);
        expect(firstWeek.every((date) => date instanceof Date)).toBe(true);
        // Feb 2026 has 28 days, so the padding before March 1st is Feb 23-28
        expect(formatIsoDate(firstWeek[0])).toBe("2026-02-23");
        expect(formatIsoDate(firstWeek[6])).toBe("2026-03-01");
    });

    it("produces the same in-month days as buildMonthGrid", () => {
        const withNulls = buildMonthGrid(2026, 2).flat().filter((d): d is Date => d !== null);
        const withDates = buildMonthGridDates(2026, 2)
            .flat()
            .filter((date) => isSameUtcMonth(date, 2026, 2));
        expect(withDates.map(formatIsoDate)).toEqual(withNulls.map(formatIsoDate));
    });
});

describe("isSameUtcMonth", () => {
    it("is true for a date within the given year/month", () => {
        expect(isSameUtcMonth(parseIsoDate("2026-03-15"), 2026, 2)).toBe(true);
    });

    it("is false for a date outside the given year/month", () => {
        expect(isSameUtcMonth(parseIsoDate("2026-02-28"), 2026, 2)).toBe(false);
        expect(isSameUtcMonth(parseIsoDate("2025-03-15"), 2026, 2)).toBe(false);
    });
});

describe("monthsBetween", () => {
    it("returns a single month when start and end fall in the same month", () => {
        expect(monthsBetween("2026-03-02", "2026-03-16")).toEqual([{ year: 2026, month: 2 }]);
    });

    it("spans multiple months inclusive of both ends", () => {
        expect(monthsBetween("2026-01-15", "2026-03-05")).toEqual([
            { year: 2026, month: 0 },
            { year: 2026, month: 1 },
            { year: 2026, month: 2 },
        ]);
    });

    it("spans a year boundary", () => {
        expect(monthsBetween("2025-12-15", "2026-01-15")).toEqual([
            { year: 2025, month: 11 },
            { year: 2026, month: 0 },
        ]);
    });
});
