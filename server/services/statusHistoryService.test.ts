import { describe, it, expect } from "vitest";
import { db } from "../db/connection.js";
import { recordStatusChange, getHistoryForEntity, getAllHistoryForSprint } from "./statusHistoryService.js";

function insertSprintStoryAndSubtask() {
    const sprint = db.prepare("INSERT INTO sprints (name, start_date) VALUES ('S', '2026-01-01')").run();
    const sprintId = Number(sprint.lastInsertRowid);
    const story = db
        .prepare("INSERT INTO stories (sprint_id, jira_url, description) VALUES (?, 'https://x', 'story')")
        .run(sprintId);
    const storyId = Number(story.lastInsertRowid);
    const subtask = db
        .prepare("INSERT INTO subtasks (story_id, title) VALUES (?, 'x')")
        .run(storyId);
    return { sprintId, storyId, subtaskId: Number(subtask.lastInsertRowid) };
}

describe("record status change / get history for entity", () => {
    it("records entries in insertion order with the given release version", () => {
        const { subtaskId } = insertSprintStoryAndSubtask();
        recordStatusChange("subtask", subtaskId, "NEW", null);
        recordStatusChange("subtask", subtaskId, "WIP", null);
        recordStatusChange("subtask", subtaskId, "TESTING", "v1.0.0");

        const history = getHistoryForEntity("subtask", subtaskId);
        expect(history.map((entry) => entry.status)).toEqual(["NEW", "WIP", "TESTING"]);
        expect(history[2].releaseVersion).toBe("v1.0.0");
    });

    it("scopes history to the given entity type and id", () => {
        const { subtaskId } = insertSprintStoryAndSubtask();
        recordStatusChange("subtask", subtaskId, "NEW", null);
        expect(getHistoryForEntity("subtask", subtaskId + 1)).toEqual([]);
        expect(getHistoryForEntity("story", subtaskId)).toEqual([]);
    });
});

describe("get all history for sprint", () => {
    it("returns history for subtasks belonging to the sprint's stories only", () => {
        const { sprintId, subtaskId } = insertSprintStoryAndSubtask();
        const other = insertSprintStoryAndSubtask();
        recordStatusChange("subtask", subtaskId, "NEW", null);
        recordStatusChange("subtask", other.subtaskId, "NEW", null);

        const history = getAllHistoryForSprint(sprintId);
        expect(history).toHaveLength(1);
        expect(history[0].entityId).toBe(subtaskId);
    });
});
