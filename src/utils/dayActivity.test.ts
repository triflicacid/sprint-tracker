import { describe, it, expect } from "vitest";
import type { DayActivityEntry } from "@shared/types";
import { groupActivitiesByStory } from "./dayActivity";

function entry(overrides: Partial<DayActivityEntry> = {}): DayActivityEntry {
    return {
        storyId: 1,
        storyLabel: "NEB-1",
        branchName: "feature/x",
        status: "WIP",
        prUrl: null,
        ...overrides,
    };
}

describe("groupActivitiesByStory", () => {
    it("passes a single-subtask story through unchanged", () => {
        const activities = [entry({ prUrl: "https://github.com/org/repo/pull/1" })];
        expect(groupActivitiesByStory(activities)).toEqual(activities);
    });

    it("keeps separate stories as separate entries", () => {
        const activities = [entry({ storyId: 1, storyLabel: "NEB-1" }), entry({ storyId: 2, storyLabel: "NEB-2" })];
        const grouped = groupActivitiesByStory(activities);
        expect(grouped).toHaveLength(2);
        expect(grouped.map((e) => e.storyLabel)).toEqual(["NEB-1", "NEB-2"]);
    });

    it("collapses multiple subtasks on the same story into one entry with a count and no single branch/pr", () => {
        const activities = [
            entry({ branchName: "feature/a", prUrl: "https://github.com/org/repo/pull/1" }),
            entry({ branchName: "feature/b", status: "IN_REVIEW", prUrl: "https://github.com/org/repo/pull/2" }),
        ];
        const grouped = groupActivitiesByStory(activities);
        expect(grouped).toEqual([
            {
                storyId: 1,
                storyLabel: "NEB-1",
                branchName: "2 subtasks",
                status: "WIP",
                prUrl: null,
            },
        ]);
    });
});
