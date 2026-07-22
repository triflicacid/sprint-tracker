import { describe, it, expect } from "vitest";
import { listSprintSummaries, createSprint, getSprintDetail, updateSprint } from "./sprintService.js";
import { SprintLockedError } from "../../shared/sprintLock.js";

describe("create sprint", () => {
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

describe("list sprint summaries", () => {
    it("orders sprints newest start date first", () => {
        createSprint({ name: "Older", startDate: "2026-01-01" });
        createSprint({ name: "Newer", startDate: "2026-02-01" });
        expect(listSprintSummaries().map((sprint) => sprint.name)).toEqual(["Newer", "Older"]);
    });
});

describe("get sprint detail", () => {
    it("includes story summaries for the sprint", () => {
        const sprint = createSprint({ name: "Sprint 1", startDate: "2026-01-01" });
        const detail = getSprintDetail(sprint.id);
        expect(detail?.stories).toEqual([]);
    });

    it("returns null for a missing sprint", () => {
        expect(getSprintDetail(999999)).toBeNull();
    });
});

describe("update sprint", () => {
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

    it("throws sprint locked error once the sprint has ended", () => {
        const sprint = createSprint({ name: "Sprint 1", startDate: "2020-01-01", endDate: "2020-01-10" });
        expect(() => updateSprint(sprint.id, { comment: "too late" })).toThrow(SprintLockedError);
    });

    it("does not throw for a sprint ending today", () => {
        const today = new Date().toISOString().slice(0, 10);
        const sprint = createSprint({ name: "Sprint 1", startDate: "2020-01-01", endDate: today });
        expect(() => updateSprint(sprint.id, { comment: "still today" })).not.toThrow();
    });

    it("does not persist the update when the sprint is locked", () => {
        const sprint = createSprint({ name: "Sprint 1", startDate: "2020-01-01", endDate: "2020-01-10", comment: "original" });
        expect(() => updateSprint(sprint.id, { comment: "too late" })).toThrow(SprintLockedError);
        const reloaded = getSprintDetail(sprint.id);
        expect(reloaded?.comment).toBe("original");
    });
});
