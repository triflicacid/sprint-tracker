import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db/connection.js";
import { createSubtask, updateSubtask, getSubtaskById, getSubtasksForStory, SubtaskUpdateError } from "./subtaskService.js";
import { getHistoryForEntity } from "./statusHistoryService.js";
import { getTagsForEntity } from "./tagService.js";

let storyId: number;

beforeEach(() => {
    const sprint = db.prepare("INSERT INTO sprints (name, start_date) VALUES ('S', '2026-01-01')").run();
    const story = db
        .prepare("INSERT INTO stories (sprint_id, jira_url, description) VALUES (?, 'https://x', 'story')")
        .run(Number(sprint.lastInsertRowid));
    storyId = Number(story.lastInsertRowid);
});

describe("createSubtask", () => {
    it("creates a subtask in NEW status and records it in history", () => {
        const subtask = createSubtask(storyId, { title: "add endpoint" });
        expect(subtask.status).toBe("NEW");
        expect(subtask.storyId).toBe(storyId);
        expect(subtask.url).toBeNull();
    });

    it("has no comment until one is set", () => {
        const subtask = createSubtask(storyId, { title: "add endpoint" });
        expect(subtask.comment).toBeNull();

        const history = getHistoryForEntity("subtask", subtask.id);
        expect(history).toHaveLength(1);
        expect(history[0].status).toBe("NEW");
    });
});

describe("getSubtaskById / getSubtasksForStory", () => {
    it("fetches a subtask by id", () => {
        const created = createSubtask(storyId, { title: "x" });
        expect(getSubtaskById(created.id)).toEqual(created);
    });

    it("returns undefined for a missing subtask", () => {
        expect(getSubtaskById(999999)).toBeUndefined();
    });

    it("lists every subtask for a story in creation order", () => {
        const a = createSubtask(storyId, { title: "a" });
        const b = createSubtask(storyId, { title: "b" });
        expect(getSubtasksForStory(storyId).map((s) => s.id)).toEqual([a.id, b.id]);
    });
});

describe("updateSubtask - plain field updates", () => {
    it("updates title without touching status or history", () => {
        const subtask = createSubtask(storyId, { title: "old" });
        const updated = updateSubtask(subtask.id, { title: "new" });
        expect(updated.title).toBe("new");
        expect(updated.status).toBe("NEW");
        expect(getHistoryForEntity("subtask", subtask.id)).toHaveLength(1);
    });

    it("sets and updates the comment independently of the title", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        const withComment = updateSubtask(subtask.id, { comment: "needs a follow-up" });
        expect(withComment.comment).toBe("needs a follow-up");
        expect(withComment.title).toBe("x");

        const updatedComment = updateSubtask(subtask.id, { comment: "resolved" });
        expect(updatedComment.comment).toBe("resolved");
        expect(updatedComment.title).toBe("x");
    });

    it("clears the comment when updated to an empty string", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        updateSubtask(subtask.id, { comment: "temporary note" });
        const cleared = updateSubtask(subtask.id, { comment: "" });
        expect(cleared.comment).toBe("");
    });

    it("leaves the comment untouched when not supplied in the update", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        updateSubtask(subtask.id, { comment: "keep me" });
        const updated = updateSubtask(subtask.id, { title: "renamed" });
        expect(updated.comment).toBe("keep me");
    });

    it("updates complexity rating independently of status", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        const updated = updateSubtask(subtask.id, { complexityRating: 3 });
        expect(updated.complexityRating).toBe(3);
    });

    it("throws for a missing subtask", () => {
        expect(() => updateSubtask(999999, { title: "x" })).toThrow(SubtaskUpdateError);
    });
});

describe("updateSubtask - status transitions", () => {
    it("rejects a transition without its required field", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        expect(() => updateSubtask(subtask.id, { status: "WIP" })).toThrow(/branch name is required/i);
    });

    it("allows a valid transition once the required field is supplied", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        const updated = updateSubtask(subtask.id, { status: "WIP", branchName: "feature/x" });
        expect(updated.status).toBe("WIP");
        expect(updated.branchName).toBe("feature/x");

        const history = getHistoryForEntity("subtask", subtask.id);
        expect(history.map((h) => h.status)).toEqual(["NEW", "WIP"]);
    });

    it("rejects skipping ahead to a non-adjacent status", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        expect(() => updateSubtask(subtask.id, { status: "DONE" })).toThrow(/cannot move from NEW to DONE/i);
    });

    it("derives the repo name from the pr url and tags the parent story with it", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        updateSubtask(subtask.id, { status: "WIP", branchName: "feature/x" });
        const updated = updateSubtask(subtask.id, {
            status: "IN_PR",
            prUrl: "https://github.com/nebula-labs/payments-service/pull/214",
        });
        expect(updated.repoName).toBe("payments-service");
        expect(updated.url).toBe("https://github.com/nebula-labs/payments-service/pull/214");

        const storyTags = getTagsForEntity("story", storyId);
        expect(storyTags.map((tag) => tag.name)).toContain("payments-service");
    });

    it("records the release version on the history entry when leaving CUT_RELEASE", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        updateSubtask(subtask.id, { status: "WIP", branchName: "feature/x" });
        updateSubtask(subtask.id, { status: "IN_REVIEW", prUrl: "https://github.com/org/repo/pull/1" });
        updateSubtask(subtask.id, { status: "CUT_RELEASE" });
        updateSubtask(subtask.id, { status: "TESTING", releaseVersion: "v1.2.0" });

        const history = getHistoryForEntity("subtask", subtask.id);
        const testingEntry = history.find((entry) => entry.status === "TESTING");
        expect(testingEntry?.releaseVersion).toBe("v1.2.0");
    });

    it("rejects leaving CUT_RELEASE without a release version", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        updateSubtask(subtask.id, { status: "WIP", branchName: "feature/x" });
        updateSubtask(subtask.id, { status: "IN_REVIEW", prUrl: "https://github.com/org/repo/pull/1" });
        updateSubtask(subtask.id, { status: "CUT_RELEASE" });
        expect(() => updateSubtask(subtask.id, { status: "TESTING" })).toThrow(/release version is required/i);
    });

    it("allows a same-status update with no validation (no-op transition)", () => {
        const subtask = createSubtask(storyId, { title: "x" });
        expect(() => updateSubtask(subtask.id, { status: "NEW" })).not.toThrow();
        expect(getHistoryForEntity("subtask", subtask.id)).toHaveLength(1);
    });
});
