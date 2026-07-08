import { describe, it, expect } from "vitest";
import { computeBurndownPoints } from "./burndown";
import type { StatusBreakdownPoint } from "@shared/types";

function point(date: string, counts: Record<string, number>): StatusBreakdownPoint {
    return { date, counts };
}

const allWorkingDays = () => true;
const noWorkingDays = () => false;

describe("computeBurndownPoints", () => {
    it("returns nothing for an empty breakdown", () => {
        expect(computeBurndownPoints([], allWorkingDays)).toEqual([]);
    });

    it("computes actual remaining as total minus the DONE count for each day", () => {
        const points = [
            point("2026-03-02", { NEW: 10, DONE: 0 }),
            point("2026-03-03", { NEW: 8, DONE: 2 }),
            point("2026-03-04", { NEW: 4, DONE: 6 }),
        ];
        const result = computeBurndownPoints(points, allWorkingDays);
        expect(result.map((p) => p.actual)).toEqual([10, 8, 4]);
    });

    it("treats a missing DONE key as zero done", () => {
        const points = [point("2026-03-02", { NEW: 5 })];
        const result = computeBurndownPoints(points, allWorkingDays);
        expect(result[0].actual).toBe(5);
    });

    it("steps the ideal line down evenly across every working day, reaching 0 on the last one", () => {
        const points = [
            point("2026-03-02", { NEW: 10, DONE: 0 }),
            point("2026-03-03", { NEW: 8, DONE: 2 }),
            point("2026-03-04", { NEW: 6, DONE: 4 }),
            point("2026-03-05", { NEW: 4, DONE: 6 }),
            point("2026-03-06", { NEW: 0, DONE: 10 }),
        ];
        const result = computeBurndownPoints(points, allWorkingDays);
        expect(result.map((p) => p.ideal)).toEqual([8, 6, 4, 2, 0]);
    });

    it("holds the ideal line flat across non-working days", () => {
        // Mon 03-02 .. Mon 03-09: 6 working days (weekend 03-07/03-08 excluded), total = 6
        const points = [
            point("2026-03-02", { NEW: 6, DONE: 0 }), // Mon
            point("2026-03-03", { NEW: 5, DONE: 1 }), // Tue
            point("2026-03-04", { NEW: 4, DONE: 2 }), // Wed
            point("2026-03-05", { NEW: 3, DONE: 3 }), // Thu
            point("2026-03-06", { NEW: 2, DONE: 4 }), // Fri
            point("2026-03-07", { NEW: 2, DONE: 4 }), // Sat
            point("2026-03-08", { NEW: 2, DONE: 4 }), // Sun
            point("2026-03-09", { NEW: 0, DONE: 6 }), // Mon
        ];
        const isWeekday = (date: string) => {
            const day = new Date(`${date}T00:00:00Z`).getUTCDay();
            return day !== 0 && day !== 6;
        };
        const result = computeBurndownPoints(points, isWeekday);
        expect(result.map((p) => p.ideal)).toEqual([5, 4, 3, 2, 1, 1, 1, 0]);
    });

    it("falls back to a flat ideal line at the starting total when there are no working days in range", () => {
        const points = [point("2026-03-07", { NEW: 3, DONE: 2 }), point("2026-03-08", { NEW: 1, DONE: 4 })];
        const result = computeBurndownPoints(points, noWorkingDays);
        expect(result.map((p) => p.ideal)).toEqual([5, 5]);
        expect(result.map((p) => p.actual)).toEqual([3, 1]);
    });
});
