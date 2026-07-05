import { describe, it, expect } from "vitest";
import { listSprintSummaries, createSprint, getSprintDetail, updateSprint } from "./sprintService.js";

describe("createSprint", () => {
    it("creates a sprint with the given fields", () => {
        const sprint = createSprint({ name: "Sprint 1", startDate: "2026-01-01", comment: "kickoff" });
        expect(sprint).toMatchObject({
            name: "Sprint 1",
            startDate: "2026-01-01",
            endDate: null,
            comment: "kickoff",
            storyCount: 0,
            prCount: 0,
        });
    });

    it("backfills the previous open-ended sprint's end date with this sprint's start date", () => {
        const first = createSprint({ name: "Sprint 1", startDate: "2026-01-01" });
        createSprint({ name: "Sprint 2", startDate: "2026-01-15" });
        const reloaded = getSprintDetail(first.id);
        expect(reloaded?.endDate).toBe("2026-01-15");
    });

    it("does not touch a previous sprint that already has an end date", () => {
        createSprint({ name: "Sprint 1", startDate: "2026-01-01", endDate: "2026-01-10" });
        createSprint({ name: "Sprint 2", startDate: "2026-02-01" });
        const summaries = listSprintSummaries();
        const sprint1 = summaries.find((sprint) => sprint.name === "Sprint 1");
        expect(sprint1?.endDate).toBe("2026-01-10");
    });
});

describe("listSprintSummaries", () => {
    it("orders sprints newest start date first", () => {
        createSprint({ name: "Older", startDate: "2026-01-01" });
        createSprint({ name: "Newer", startDate: "2026-02-01" });
        expect(listSprintSummaries().map((sprint) => sprint.name)).toEqual(["Newer", "Older"]);
    });
});

describe("getSprintDetail", () => {
    it("includes story summaries for the sprint", () => {
        const sprint = createSprint({ name: "Sprint 1", startDate: "2026-01-01" });
        const detail = getSprintDetail(sprint.id);
        expect(detail?.stories).toEqual([]);
    });

    it("returns null for a missing sprint", () => {
        expect(getSprintDetail(999999)).toBeNull();
    });
});

describe("updateSprint", () => {
    it("updates only the provided fields, keeping the rest", () => {
        const sprint = createSprint({ name: "Sprint 1", startDate: "2026-01-01", comment: "original" });
        updateSprint(sprint.id, { comment: "updated" });
        const reloaded = getSprintDetail(sprint.id);
        expect(reloaded?.comment).toBe("updated");
        expect(reloaded?.name).toBe("Sprint 1");
        expect(reloaded?.startDate).toBe("2026-01-01");
    });

    it("is a no-op for a missing sprint", () => {
        expect(() => updateSprint(999999, { comment: "x" })).not.toThrow();
    });
});
