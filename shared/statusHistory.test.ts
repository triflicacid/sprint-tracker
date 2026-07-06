import { describe, it, expect } from "vitest";
import { statusAsOf, type StatusHistoryLike } from "./statusHistory.js";

describe("statusAsOf", () => {
    it("returns NEW before any history entry applies", () => {
        const history: StatusHistoryLike[] = [{ status: "WIP", changedAt: "2026-03-05" }];
        expect(statusAsOf(history, "2026-03-01")).toBe("NEW");
    });

    it("returns the status as of a day with a single transition", () => {
        const history: StatusHistoryLike[] = [
            { status: "NEW", changedAt: "2026-03-01" },
            { status: "WIP", changedAt: "2026-03-02" },
        ];
        expect(statusAsOf(history, "2026-03-02")).toBe("WIP");
        expect(statusAsOf(history, "2026-03-03")).toBe("WIP");
    });

    it("uses the LAST transition of a day when several happen the same day", () => {
        const history: StatusHistoryLike[] = [
            { status: "NEW", changedAt: "2026-03-01 09:00:00" },
            { status: "WIP", changedAt: "2026-03-01 09:10:00" },
            { status: "PR_COMMENTS", changedAt: "2026-03-05 10:00:00" },
            { status: "IN_REVIEW", changedAt: "2026-03-05 17:00:00" },
            { status: "CUT_RELEASE", changedAt: "2026-03-05 19:00:00" },
        ];
        expect(statusAsOf(history, "2026-03-05")).toBe("CUT_RELEASE");
    });

    it("ignores transitions after the given date", () => {
        const history: StatusHistoryLike[] = [
            { status: "NEW", changedAt: "2026-03-01" },
            { status: "WIP", changedAt: "2026-03-02" },
            { status: "DONE", changedAt: "2026-03-10" },
        ];
        expect(statusAsOf(history, "2026-03-05")).toBe("WIP");
    });
});
