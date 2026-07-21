import { describe, it, expect } from "vitest";
import {
    computeSubtaskTiming,
    buildTransitionRows,
    formatDurationDHM,
    formatDateTime,
    buildTransitionsPdfTable,
    buildPhaseTotalsLines,
    buildSubtaskPdfSection,
} from "./subtaskTiming";
import type { StatusHistoryEntry, Subtask, SubtaskStatus } from "@shared/types";

let nextId = 1;
function entry(status: SubtaskStatus, changedAt: string): StatusHistoryEntry {
    return { id: nextId++, entityType: "subtask", entityId: 1, status, releaseVersion: null, changedAt };
}

function subtask(overrides: Partial<Subtask> = {}): Subtask {
    return {
        id: 1,
        storyId: 1,
        title: "add endpoint",
        comment: null,
        branchName: "(unknown)",
        status: "NEW",
        url: null,
        repoName: null,
        complexityRating: null,
        releaseVersion: null,
        type: "unknown",
        createdAt: "2026-01-01",
        ...overrides,
    };
}

describe("buildTransitionRows", () => {
    it("returns an empty array for no history", () => {
        expect(buildTransitionRows([])).toEqual([]);
    });

    it("marks the first row's daysInPrevious as null and computes the rest", () => {
        const history = [
            entry("NEW", "2026-07-01T00:00:00.000Z"),
            entry("WIP", "2026-07-03T00:00:00.000Z"),
            entry("IN_PR", "2026-07-04T00:00:00.000Z"),
        ];

        expect(buildTransitionRows(history)).toEqual([
            { id: history[0].id, changedAt: "2026-07-01T00:00:00.000Z", status: "NEW", daysInPrevious: null, msInPrevious: null },
            { id: history[1].id, changedAt: "2026-07-03T00:00:00.000Z", status: "WIP", daysInPrevious: 2, msInPrevious: 2 * 86400000 },
            { id: history[2].id, changedAt: "2026-07-04T00:00:00.000Z", status: "IN_PR", daysInPrevious: 1, msInPrevious: 86400000 },
        ]);
    });

    it("keeps every same-day transition as its own row instead of collapsing them", () => {
        const history = [
            entry("PR_COMMENTS", "2026-03-05T10:00:00.000Z"),
            entry("IN_REVIEW", "2026-03-05T17:00:00.000Z"),
            entry("CUT_RELEASE", "2026-03-05T19:00:00.000Z"),
        ];

        const rows = buildTransitionRows(history);
        expect(rows).toHaveLength(3);
        expect(rows.map((r) => r.status)).toEqual(["PR_COMMENTS", "IN_REVIEW", "CUT_RELEASE"]);
        // same calendar day, so 0 whole days elapsed between each - but each
        // is still its own distinct row, not merged away.
        expect(rows[1].daysInPrevious).toBe(0);
        expect(rows[2].daysInPrevious).toBe(0);
        // msInPrevious keeps the precision daysInPrevious rounds away - this
        // is exactly the case the on-page table needs it for.
        expect(rows[1].msInPrevious).toBe(7 * 60 * 60 * 1000); // 10:00 -> 17:00
        expect(rows[2].msInPrevious).toBe(2 * 60 * 60 * 1000); // 17:00 -> 19:00
    });

    it("sorts out-of-order history before pairing rows", () => {
        const history = [entry("WIP", "2026-07-03T00:00:00.000Z"), entry("NEW", "2026-07-01T00:00:00.000Z")];

        const rows = buildTransitionRows(history);
        expect(rows.map((r) => r.status)).toEqual(["NEW", "WIP"]);
        expect(rows[1].daysInPrevious).toBe(2);
    });
});

describe("formatDurationDHM", () => {
    it("formats a zero duration as all-zero units", () => {
        expect(formatDurationDHM(0)).toBe("0d 0h 0m");
    });

    it("formats a sub-day duration with no days", () => {
        expect(formatDurationDHM(2 * 60 * 60 * 1000 + 15 * 60 * 1000)).toBe("0d 2h 15m");
    });

    it("formats a multi-day duration with all three units", () => {
        const ms = 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 20 * 60 * 1000;
        expect(formatDurationDHM(ms)).toBe("1d 4h 20m");
    });

    it("rounds to the nearest minute", () => {
        expect(formatDurationDHM(90 * 1000)).toBe("0d 0h 2m"); // 90s rounds up to 2m
        expect(formatDurationDHM(29 * 1000)).toBe("0d 0h 0m"); // 29s rounds down to 0m
    });
});

describe("formatDateTime", () => {
    it("formats an ISO timestamp as date + hours:minutes", () => {
        expect(formatDateTime("2026-03-05T19:05:00.000Z")).toBe("2026-03-05 19:05");
    });

    it("formats sqlite's space-separated 'YYYY-MM-DD HH:MM:SS' as-is, with no timezone shift", () => {
        // this is the actual format changed_at is stored/returned as - it has
        // no timezone marker, so it must never round-trip through `new
        // Date(...)` for display or the shown hour could shift depending on
        // the runtime's local timezone.
        expect(formatDateTime("2026-03-05 19:05:00")).toBe("2026-03-05 19:05");
    });

    it("formats a date-only string as midnight", () => {
        expect(formatDateTime("2026-03-05")).toBe("2026-03-05 00:00");
    });
});

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

describe("buildTransitionsPdfTable", () => {
    it("returns the same 3 headers and column widths as the on-page table's columns", () => {
        const table = buildTransitionsPdfTable([]);
        expect(table.headers).toEqual(["date/time", "state", "time in previous"]);
        expect(table.rows).toEqual([]);
    });

    it("draws one row per transition, with the state cell colored to match its status", () => {
        const history = [
            entry("NEW", "2026-03-05T09:00:00.000Z"),
            entry("WIP", "2026-03-05T09:10:00.000Z"),
        ];

        const table = buildTransitionsPdfTable(history);

        expect(table.rows).toHaveLength(2);
        expect(table.rows[0]).toEqual([
            { text: "2026-03-05 09:00" },
            { text: "new", color: [107, 114, 128] }, // #6b7280
            { text: "-" },
        ]);
        expect(table.rows[1]).toEqual([
            { text: "2026-03-05 09:10" },
            { text: "wip", color: [217, 89, 38] }, // #d95926
            { text: "0d 0h 10m" },
        ]);
    });

    it("keeps every same-day transition as its own row - the exact gap this table exists to close", () => {
        const history = [
            entry("PR_COMMENTS", "2026-03-05T10:00:00.000Z"),
            entry("IN_REVIEW", "2026-03-05T17:00:00.000Z"),
            entry("CUT_RELEASE", "2026-03-05T19:00:00.000Z"),
        ];

        const table = buildTransitionsPdfTable(history);

        expect(table.rows).toHaveLength(3);
        expect(table.rows.map((row) => row[1].text)).toEqual(["pr comments", "in review", "cut release"]);
        expect(table.rows[1][2]).toEqual({ text: "0d 7h 0m" });
        expect(table.rows[2][2]).toEqual({ text: "0d 2h 0m" });
    });
});

describe("buildPhaseTotalsLines", () => {
    it("returns nothing for empty history", () => {
        expect(buildPhaseTotalsLines([])).toEqual([]);
    });

    it("matches computeSubtaskTiming's own totals summary exactly", () => {
        const history = [
            entry("NEW", "2026-07-01T00:00:00.000Z"),
            entry("WIP", "2026-07-02T00:00:00.000Z"),
            entry("DONE", "2026-07-05T00:00:00.000Z"),
        ];
        const now = new Date("2026-07-20T00:00:00.000Z");

        expect(buildPhaseTotalsLines(history, now)).toEqual(["Total time in each phase:", "new: 1 day, wip: 3 days"]);
        // and computeSubtaskTiming's full report still ends with the exact
        // same two lines, proving the extraction didn't change either one.
        expect(computeSubtaskTiming(history, now).lines.slice(-2)).toEqual(buildPhaseTotalsLines(history, now));
    });
});

describe("buildSubtaskPdfSection", () => {
    it("appends the branch name to the title when it is known", () => {
        const section = buildSubtaskPdfSection(subtask({ title: "add endpoint", branchName: "feature/x" }), []);
        expect(section.title).toBe("add endpoint (feature/x)");
    });

    it("leaves the title bare when the branch name is unknown", () => {
        const section = buildSubtaskPdfSection(subtask({ title: "add endpoint", branchName: "(unknown)" }), []);
        expect(section.title).toBe("add endpoint");
    });

    it("has no table and reports no status history when there is none", () => {
        const section = buildSubtaskPdfSection(subtask(), []);
        expect(section.table).toBeUndefined();
        expect(section.lines).toEqual(["No status history recorded yet."]);
    });

    it("draws the transitions table and phase totals when history is present", () => {
        const history = [entry("NEW", "2026-07-01T00:00:00.000Z"), entry("WIP", "2026-07-03T00:00:00.000Z")];
        const section = buildSubtaskPdfSection(subtask(), history);

        expect(section.table).toEqual(buildTransitionsPdfTable(history));
        expect(section.lines).toEqual(expect.arrayContaining(["Total time in each phase:"]));
    });

    it("includes the pull request link as the first line when the subtask has a url", () => {
        const section = buildSubtaskPdfSection(subtask({ url: "https://github.com/acme/repo/pull/7" }), []);
        expect(section.lines?.[0]).toEqual({
            text: "Pull request: https://github.com/acme/repo/pull/7",
            url: "https://github.com/acme/repo/pull/7",
        });
    });

    it("omits the pull request line when the subtask has no url", () => {
        const section = buildSubtaskPdfSection(subtask({ url: null }), []);
        expect(section.lines).not.toEqual(expect.arrayContaining([expect.objectContaining({ url: expect.anything() })]));
    });
});
