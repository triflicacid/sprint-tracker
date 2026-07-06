import { describe, it, expect } from "vitest";
import { computeSubtaskTiming } from "./subtaskTiming";
import type { StatusHistoryEntry } from "@shared/types";

function entry(status: string, changedAt: string): StatusHistoryEntry {
    return { id: 0, entityType: "subtask", entityId: 1, status, releaseVersion: null, changedAt };
}

describe("computeSubtaskTiming", () => {
    it("reports no history recorded when the subtask has none", () => {
        const result = computeSubtaskTiming([]);
        expect(result).toEqual({ totalDays: 0, lines: ["No status history recorded yet."] });
    });

    it("marks a still-open subtask's current phase as ongoing", () => {
        const history = [entry("NEW", "2026-07-01T00:00:00.000Z"), entry("WIP", "2026-07-03T00:00:00.000Z")];
        const now = new Date("2026-07-06T00:00:00.000Z");

        const result = computeSubtaskTiming(history, now);

        expect(result.totalDays).toBe(5);
        expect(result.lines).toEqual([
            "Transitions:",
            "2026-07-01: new",
            "2026-07-03: wip (2 days in new)",
            "",
            "Total time in each phase:",
            "new: 2 days, wip: 3 days (ongoing)",
        ]);
    });

    it("does not mark the final phase as ongoing once the subtask reaches the terminal status", () => {
        const history = [
            entry("NEW", "2026-07-01T00:00:00.000Z"),
            entry("WIP", "2026-07-02T00:00:00.000Z"),
            entry("DONE", "2026-07-05T00:00:00.000Z"),
        ];

        const result = computeSubtaskTiming(history, new Date("2026-07-20T00:00:00.000Z"));

        expect(result.totalDays).toBe(4);
        expect(result.lines).toEqual([
            "Transitions:",
            "2026-07-01: new",
            "2026-07-02: wip (1 day in new)",
            "2026-07-05: done (3 days in wip)",
            "",
            "Total time in each phase:",
            "new: 1 day, wip: 3 days",
        ]);
    });

    it("sums repeated visits to the same status", () => {
        const history = [
            entry("NEW", "2026-07-01T00:00:00.000Z"),
            entry("WIP", "2026-07-02T00:00:00.000Z"), // 1 day in new
            entry("IN_REVIEW", "2026-07-04T00:00:00.000Z"), // 2 days in wip
            entry("WIP", "2026-07-05T00:00:00.000Z"), // 1 day in in_review
            entry("IN_REVIEW", "2026-07-08T00:00:00.000Z"), // 3 days in wip
        ];

        const result = computeSubtaskTiming(history, new Date("2026-07-08T00:00:00.000Z"));

        const totalsLine = result.lines[result.lines.length - 1];
        // wip visited twice (2 days + 3 days = 5); in_review visited twice
        // too - once for a completed 1-day stint, once as the current
        // (ongoing) phase with 0 elapsed days so far - both count toward its total.
        expect(totalsLine).toBe("new: 1 day, wip: 5 days, in review: 1 day (ongoing)");
    });

    it("sorts out-of-order history entries before computing durations", () => {
        const history = [
            entry("WIP", "2026-07-03T00:00:00.000Z"),
            entry("NEW", "2026-07-01T00:00:00.000Z"),
        ];

        const result = computeSubtaskTiming(history, new Date("2026-07-03T00:00:00.000Z"));

        expect(result.lines).toEqual([
            "Transitions:",
            "2026-07-01: new",
            "2026-07-03: wip (2 days in new)",
            "",
            "Total time in each phase:",
            "new: 2 days, wip: 0 days (ongoing)",
        ]);
    });
});
