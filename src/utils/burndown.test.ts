import { describe, it, expect } from "vitest";
import { computeBurndownPoints, computeAdvancedBurndownPoints } from "./burndown";
import type {StatusBreakdownPoint, SubtaskStatus} from "@shared/types";

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

const ALL_STATUSES_ORDERED: SubtaskStatus[] = ["NEW", "WIP", "TESTING", "UAT", "DONE"];
const MILESTONES: SubtaskStatus[] = ["NEW", "TESTING", "UAT", "DONE"];

describe("computeAdvancedBurndownPoints", () => {
    it("returns nothing for an empty breakdown", () => {
        expect(computeAdvancedBurndownPoints([], ALL_STATUSES_ORDERED, MILESTONES, allWorkingDays)).toEqual([]);
    });

    it("burns each milestone down as total minus everything at or beyond it that day", () => {
        const points = [point("2026-03-02", { NEW: 2, WIP: 3, TESTING: 1, UAT: 2, DONE: 2 })];
        const result = computeAdvancedBurndownPoints(points, ALL_STATUSES_ORDERED, MILESTONES, allWorkingDays);
        expect(result[0].counts).toEqual({
            NEW: 0, // every item has at least reached NEW - nothing left before it
            TESTING: 5, // 10 - (TESTING + UAT + DONE = 5)
            UAT: 6, // 10 - (UAT + DONE = 4)
            DONE: 8, // 10 - (DONE = 2), same as the basic chart's actual line
        });
    });

    it("treats a missing status key as zero for that status", () => {
        const points = [point("2026-03-02", { NEW: 1, DONE: 1 })];
        const result = computeAdvancedBurndownPoints(points, ALL_STATUSES_ORDERED, MILESTONES, allWorkingDays);
        expect(result[0].counts).toEqual({ NEW: 0, TESTING: 1, UAT: 1, DONE: 1 });
    });

    it("excludes synthetic pre-NEW statuses (e.g. JIRA_ONLY/WORK_REMAINING) from the NEW milestone", () => {
        const storyOrdered = ["JIRA_ONLY", "WORK_REMAINING", "NEW", "WIP", "DONE"];
        const points = [point("2026-03-02", { JIRA_ONLY: 3, WORK_REMAINING: 2, NEW: 1, WIP: 1, DONE: 1 })];
        const result = computeAdvancedBurndownPoints(points, storyOrdered, ["NEW", "DONE"] as SubtaskStatus[], allWorkingDays);
        // 8 total, 3 (JIRA_ONLY) + 2 (WORK_REMAINING) = 5 haven't reached NEW yet
        expect(result[0].counts).toEqual({ NEW: 5, DONE: 7 });
    });

    it("tracks the milestone counts burning down day to day as work progresses", () => {
        const points = [
            point("2026-03-02", { NEW: 5, WIP: 0, TESTING: 0, UAT: 0, DONE: 0 }),
            point("2026-03-03", { NEW: 2, WIP: 1, TESTING: 2, UAT: 0, DONE: 0 }),
            point("2026-03-04", { NEW: 0, WIP: 0, TESTING: 1, UAT: 2, DONE: 2 }),
        ];
        const result = computeAdvancedBurndownPoints(points, ALL_STATUSES_ORDERED, MILESTONES, allWorkingDays);
        expect(result.map((p) => p.counts.TESTING)).toEqual([5, 3, 0]);
        expect(result.map((p) => p.counts.DONE)).toEqual([5, 5, 3]);
    });

    it("carries the same ideal reference line as computeBurndownPoints", () => {
        const points = [
            point("2026-03-02", { NEW: 10, DONE: 0 }),
            point("2026-03-03", { NEW: 8, DONE: 2 }),
        ];
        const basic = computeBurndownPoints(points, allWorkingDays);
        const advanced = computeAdvancedBurndownPoints(points, ["NEW", "DONE"], ["DONE"] as SubtaskStatus[], allWorkingDays);
        expect(advanced.map((p) => p.ideal)).toEqual(basic.map((p) => p.ideal));
    });
});
