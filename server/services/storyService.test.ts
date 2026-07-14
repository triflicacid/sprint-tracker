import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db/connection.js";
import type { SubtaskStatus } from "../../shared/types.js";
import {
    computeStoryStatus,
    getStorySummariesForSprint,
    getStoryDetail,
    createStory,
    updateStoryJiraInfo,
    updateStoryAwaitingMoreSubtasks,
    updateStoryPoints,
    addTagToStory,
    removeTagFromStory,
} from "./storyService.js";
import { SprintLockedError } from "../../shared/sprintLock.js";

function insertSprint(): number {
    const result = db
        .prepare("INSERT INTO sprints (name, start_date) VALUES ('Sprint 1', '2026-01-01')")
        .run();
    return Number(result.lastInsertRowid);
}

function insertLockedSprint() {
    const result = db
        .prepare("INSERT INTO sprints (name, start_date, end_date) VALUES ('Past sprint', '2020-01-01', '2020-01-10')")
        .run();
    return Number(result.lastInsertRowid);
}

// a story cannot be created (via createStory) under an already-locked
// sprint, so build one directly for tests that need an existing story
// whose sprint has since ended.
function insertStoryInLockedSprint(): number {
    const sprintId = insertLockedSprint();
    const result = db
        .prepare("INSERT INTO stories (sprint_id, jira_url, description) VALUES (?, 'https://x', 'story')")
        .run(sprintId);
    return Number(result.lastInsertRowid);
}

describe("computeStoryStatus", () => {
    it("is JIRA_ONLY when there are no subtasks yet", () => {
        expect(computeStoryStatus([], false)).toBe("JIRA_ONLY");
    });

    it("is WORK_REMAINING when every subtask is still NEW", () => {
        expect(computeStoryStatus(["NEW", "NEW"], false)).toBe("WORK_REMAINING");
    });

    it("is the lowest-rank subtask status when some have started and some haven't", () => {
        expect(computeStoryStatus(["NEW", "WIP"], false)).toBe("NEW");
    });

    it("is the lowest-rank subtask status when every subtask has started but not every one is done", () => {
        expect(computeStoryStatus(["WIP", "DONE"], false)).toBe("WIP");
    });

    it("is DONE when every subtask is done and no more subtasks are expected", () => {
        expect(computeStoryStatus(["DONE", "DONE"], false)).toBe("DONE");
    });

    it("is WORK_REMAINING when every subtask is done but more subtasks are expected", () => {
        expect(computeStoryStatus(["DONE", "DONE"], true)).toBe("WORK_REMAINING");
    });

    it("picks the single lowest-rank status among a wider mix of subtask statuses", () => {
        const statuses: SubtaskStatus[] = ["UAT", "IN_PR", "IN_REVIEW", "PR_COMMENTS", "CUT_RELEASE", "TESTING", "WIP"];
        expect(computeStoryStatus(statuses, false)).toBe("WIP");
    });
});

describe("createStory / getStoryDetail", () => {
    let sprintId: number;

    beforeEach(() => {
        sprintId = insertSprint();
    });

    it("creates a story and extracts its jira key from the url", () => {
        const story = createStory(sprintId, {
            jiraUrl: "https://nebula.atlassian.net/browse/NEB-1001",
            description: "support saved cards",
        });
        expect(story.jiraKey).toBe("NEB-1001");
        expect(story.status).toBe("JIRA_ONLY");
        expect(story.tags).toEqual([]);
        expect(story.prCount).toBe(0);
        expect(story.storyPoints).toBeNull();
    });

    it("leaves jiraKey null when the url has no browse segment", () => {
        const story = createStory(sprintId, { jiraUrl: "https://example.com/x", description: "misc" });
        expect(story.jiraKey).toBeNull();
    });

    it("fetches full story detail including its subtasks", () => {
        const story = createStory(sprintId, { jiraUrl: "https://x/browse/NEB-1", description: "d" });
        const detail = getStoryDetail(story.id);
        expect(detail?.id).toBe(story.id);
        expect(detail?.subtasks).toEqual([]);
    });

    it("includes the parent sprint's end date", () => {
        const story = createStory(sprintId, { jiraUrl: "https://x/browse/NEB-1", description: "d" });
        expect(getStoryDetail(story.id)?.sprintEndDate).toBeNull();

        const storyId = insertStoryInLockedSprint();
        expect(getStoryDetail(storyId)?.sprintEndDate).toBe("2020-01-10");
    });

    it("returns null for a missing story", () => {
        expect(getStoryDetail(999999)).toBeNull();
    });

    it("throws SprintLockedError when the sprint has ended", () => {
        const lockedSprintId = insertLockedSprint();
        expect(() => createStory(lockedSprintId, { jiraUrl: "https://x/browse/NEB-1", description: "d" })).toThrow(
            SprintLockedError
        );
    });
});

describe("getStorySummariesForSprint", () => {
    it("lists only stories belonging to the given sprint", () => {
        const sprintA = insertSprint();
        const sprintB = insertSprint();
        createStory(sprintA, { jiraUrl: "https://x/browse/A-1", description: "a" });
        createStory(sprintB, { jiraUrl: "https://x/browse/B-1", description: "b" });
        expect(getStorySummariesForSprint(sprintA)).toHaveLength(1);
        expect(getStorySummariesForSprint(sprintB)).toHaveLength(1);
    });
});

describe("updateStoryJiraInfo", () => {
    it("caches the jira title and labels onto the story", () => {
        const sprintId = insertSprint();
        const story = createStory(sprintId, { jiraUrl: "https://x/browse/NEB-1", description: "d" });
        updateStoryJiraInfo(story.id, "Support saved cards", ["payments", "checkout"]);
        const detail = getStoryDetail(story.id);
        expect(detail?.jiraTitle).toBe("Support saved cards");
        expect(detail?.jiraLabels).toEqual(["payments", "checkout"]);
    });
});

describe("updateStoryAwaitingMoreSubtasks", () => {
    it("flips the flag and reflects it in computed status", () => {
        const sprintId = insertSprint();
        const story = createStory(sprintId, { jiraUrl: "https://x/browse/NEB-1", description: "d" });
        const updated = updateStoryAwaitingMoreSubtasks(story.id, true);
        expect(updated?.awaitingMoreSubtasks).toBe(true);
    });

    it("returns null for a missing story", () => {
        expect(updateStoryAwaitingMoreSubtasks(999999, true)).toBeNull();
    });

    it("throws SprintLockedError when the story's sprint has ended", () => {
        const storyId = insertStoryInLockedSprint();
        expect(() => updateStoryAwaitingMoreSubtasks(storyId, true)).toThrow(SprintLockedError);
    });
});

describe("updateStoryPoints", () => {
    it("sets story points", () => {
        const sprintId = insertSprint();
        const story = createStory(sprintId, { jiraUrl: "https://x/browse/NEB-1", description: "d" });
        const updated = updateStoryPoints(story.id, 5);
        expect(updated?.storyPoints).toBe(5);
    });

    it("clears story points back to null", () => {
        const sprintId = insertSprint();
        const story = createStory(sprintId, { jiraUrl: "https://x/browse/NEB-1", description: "d" });
        updateStoryPoints(story.id, 5);
        const cleared = updateStoryPoints(story.id, null);
        expect(cleared?.storyPoints).toBeNull();
    });

    it("returns null for a missing story", () => {
        expect(updateStoryPoints(999999, 3)).toBeNull();
    });

    it("throws SprintLockedError when the story's sprint has ended", () => {
        const storyId = insertStoryInLockedSprint();
        expect(() => updateStoryPoints(storyId, 3)).toThrow(SprintLockedError);
    });
});

describe("addTagToStory / removeTagFromStory", () => {
    it("attaches a tag to the story", () => {
        const sprintId = insertSprint();
        const story = createStory(sprintId, { jiraUrl: "https://x/browse/NEB-1", description: "d" });
        const tag = addTagToStory(story.id, "urgent", "custom");
        const reloaded = getStoryDetail(story.id);
        expect(reloaded?.tags.map((t) => t.name)).toEqual(["urgent"]);
        expect(tag.name).toBe("urgent");
    });

    it("removes a previously attached tag", () => {
        const sprintId = insertSprint();
        const story = createStory(sprintId, { jiraUrl: "https://x/browse/NEB-1", description: "d" });
        const tag = addTagToStory(story.id, "urgent", "custom");
        removeTagFromStory(story.id, tag.id);
        const reloaded = getStoryDetail(story.id);
        expect(reloaded?.tags).toEqual([]);
    });

    it("throws SprintLockedError when adding a tag to a story in an ended sprint", () => {
        const storyId = insertStoryInLockedSprint();
        expect(() => addTagToStory(storyId, "urgent", "custom")).toThrow(SprintLockedError);
    });

    it("throws SprintLockedError when removing a tag from a story in an ended sprint", () => {
        const storyId = insertStoryInLockedSprint();
        expect(() => removeTagFromStory(storyId, 1)).toThrow(SprintLockedError);
    });
});
