import { describe, it, expect } from "vitest";
import { computeDaySegments } from "./dayStatusSegments";
import type { StatusHistoryLike } from "@shared/statusHistory";
import type { SubtaskStatus } from "@shared/types";

function entry(status: SubtaskStatus, changedAt: string) {
    return { status, changedAt } as StatusHistoryLike;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

describe("computeDaySegments", () => {
    it("returns nothing for empty history", () => {
        expect(computeDaySegments([], "2026-03-05")).toEqual([]);
    });

    it("returns one segment spanning the whole day when nothing changes that day", () => {
        const history = [entry("WIP", "2026-03-01 09:00:00")];
        const segments = computeDaySegments(history, "2026-03-05");
        expect(segments).toEqual([{ status: "WIP", durationMs: DAY_MS }]);
    });

    it("splits a day with multiple transitions proportionally to time held in each status", () => {
        const history = [
            entry("PR_COMMENTS", "2026-03-05 00:00:00"),
            entry("IN_REVIEW", "2026-03-05 07:00:00"),
            entry("CUT_RELEASE", "2026-03-05 09:00:00"),
        ];
        const segments = computeDaySegments(history, "2026-03-05");
        expect(segments).toEqual([
            { status: "PR_COMMENTS", durationMs: 7 * HOUR_MS },
            { status: "IN_REVIEW", durationMs: 2 * HOUR_MS },
            { status: "CUT_RELEASE", durationMs: 15 * HOUR_MS }, // holds until midnight, the day's end
        ]);
    });

    it("clips a segment that started on an earlier day to just this day's portion", () => {
        const history = [entry("WIP", "2026-03-01 12:00:00"), entry("IN_REVIEW", "2026-03-05 06:00:00")];
        const segments = computeDaySegments(history, "2026-03-05");
        expect(segments).toEqual([
            { status: "WIP", durationMs: 6 * HOUR_MS }, // midnight -> 06:00
            { status: "IN_REVIEW", durationMs: 18 * HOUR_MS }, // 06:00 -> midnight
        ]);
    });

    it("clips the last segment to end of day when the next transition is on a later day", () => {
        const history = [entry("WIP", "2026-03-05 20:00:00"), entry("DONE", "2026-03-08 09:00:00")];
        const segments = computeDaySegments(history, "2026-03-05");
        expect(segments).toEqual([{ status: "WIP", durationMs: 4 * HOUR_MS }]); // 20:00 -> midnight
    });

    it("is not thrown off by the runtime's local timezone", () => {
        const history = [entry("WIP", "2026-03-05 23:30:00")];
        const segments = computeDaySegments(history, "2026-03-05");
        expect(segments).toEqual([{ status: "WIP", durationMs: 30 * 60 * 1000 }]); // 23:30 -> midnight
    });
});
