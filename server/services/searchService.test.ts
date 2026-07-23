import { describe, it, expect } from "vitest";
import { db } from "../db/connection.js";
import { search, SearchValidationError } from "./searchService.js";

function insertSprint(input: {
    name: string;
    startDate: string;
    endDate?: string | null;
    comment?: string | null;
    project?: string | null;
}) {
    const result = db
        .prepare("INSERT INTO sprints (name, start_date, end_date, comment, project) VALUES (?, ?, ?, ?, ?)")
        .run(input.name, input.startDate, input.endDate ?? null, input.comment ?? null, input.project ?? null);
    return Number(result.lastInsertRowid);
}

function insertStory(input: {
    sprintId: number;
    jiraUrl?: string;
    jiraKey?: string | null;
    description: string;
    jiraTitle?: string | null;
    jiraLabels?: string[];
}) {
    const result = db
        .prepare(
            "INSERT INTO stories (sprint_id, jira_url, jira_key, description, jira_title, jira_labels) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .run(
            input.sprintId,
            input.jiraUrl ?? "https://jira.example/browse/DEMO-1",
            input.jiraKey ?? null,
            input.description,
            input.jiraTitle ?? null,
            input.jiraLabels ? JSON.stringify(input.jiraLabels) : null
        );
    return Number(result.lastInsertRowid);
}

function insertSubtask(input: {
    storyId: number;
    title: string;
    comment?: string | null;
    branchName?: string | null;
    status?: string;
    type?: string;
    repoName?: string | null;
    complexityRating?: number | null;
    releaseVersion?: string | null;
}) {
    const result = db
        .prepare(
            `INSERT INTO subtasks (
                story_id, title, comment, branch_name, status, type, repo_name, complexity_rating, release_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
            input.storyId,
            input.title,
            input.comment ?? null,
            input.branchName ?? null,
            input.status ?? "NEW",
            input.type ?? "feature",
            input.repoName ?? null,
            input.complexityRating ?? null,
            input.releaseVersion ?? null
        );
    return Number(result.lastInsertRowid);
}

function insertTag(name: string) {
    const result = db.prepare("INSERT INTO tags (name, tag_type) VALUES (?, 'custom')").run(name);
    return Number(result.lastInsertRowid);
}

function attachStoryTag(storyId: number, tagId: number) {
    db.prepare("INSERT INTO entity_tags (entity_type, entity_id, tag_id) VALUES ('story', ?, ?)").run(storyId, tagId);
}

describe("search", () => {
    it("rejects requests with no text query and no tags", () => {
        expect(() => search({})).toThrow(SearchValidationError);
    });

    it("rejects one-character queries", () => {
        expect(() => search({ query: "a" })).toThrow("query must be at least 2 characters");
    });

    it("matches sprint text fields case-insensitively", () => {
        insertSprint({
            name: "Q2 Platform Work",
            startDate: "2026-04-01",
            comment: "Authentication hardening",
            project: "Nebula",
        });

        const byName = search({ query: "platform" });
        const byComment = search({ query: "AUTHENTICATION" });
        const byProject = search({ query: "nebula" });

        expect(byName.sprints).toHaveLength(1);
        expect(byComment.sprints).toHaveLength(1);
        expect(byProject.sprints).toHaveLength(1);
    });

    it("matches stories by description, jira key, title, and jira label text", () => {
        const sprintId = insertSprint({ name: "Sprint", startDate: "2026-01-01" });
        insertStory({
            sprintId,
            jiraKey: "NEB-42",
            description: "Enable OAuth device flow",
            jiraTitle: "Auth journey",
            jiraLabels: ["security", "backend"],
        });

        expect(search({ query: "oauth" }).stories).toHaveLength(1);
        expect(search({ query: "neb-42" }).stories).toHaveLength(1);
        expect(search({ query: "journey" }).stories).toHaveLength(1);
        expect(search({ query: "BACKEND" }).stories).toHaveLength(1);
    });

    it("matches subtasks by title, comment, branch, repo, and release version", () => {
        const sprintId = insertSprint({ name: "Sprint", startDate: "2026-01-01" });
        const storyId = insertStory({ sprintId, description: "Story" });
        insertSubtask({
            storyId,
            title: "Implement JWT middleware",
            comment: "Token validation and refresh",
            branchName: "feature/auth-middleware",
            repoName: "api-service",
            releaseVersion: "v2.1.0",
        });

        expect(search({ query: "jwt" }).subtasks).toHaveLength(1);
        expect(search({ query: "refresh" }).subtasks).toHaveLength(1);
        expect(search({ query: "auth-middleware" }).subtasks).toHaveLength(1);
        expect(search({ query: "api-service" }).subtasks).toHaveLength(1);
        expect(search({ query: "v2.1.0" }).subtasks).toHaveLength(1);
    });

    it("treats SQL LIKE special characters as literals", () => {
        const sprintId = insertSprint({ name: "Sprint", startDate: "2026-01-01" });
        const storyId = insertStory({ sprintId, description: "Escape test" });
        insertSubtask({ storyId, title: "lookup_100%" });

        const results = search({ query: "_100%" });
        expect(results.subtasks).toHaveLength(1);
    });

    it("supports tags-only search for stories and subtasks while skipping sprints", () => {
        const sprintId = insertSprint({ name: "Sprint", startDate: "2026-01-01" });
        const matchingStoryId = insertStory({ sprintId, description: "Story with auth tag" });
        const nonMatchingStoryId = insertStory({ sprintId, description: "Story without tag" });
        const authTagId = insertTag("auth");
        attachStoryTag(matchingStoryId, authTagId);

        insertSubtask({ storyId: matchingStoryId, title: "Tagged subtask" });
        insertSubtask({ storyId: nonMatchingStoryId, title: "Other subtask" });

        const results = search({ tagIds: [authTagId] });
        expect(results.sprints).toEqual([]);
        expect(results.stories.map((story) => story.id)).toEqual([matchingStoryId]);
        expect(results.subtasks).toHaveLength(1);
        expect(results.subtasks[0].storyId).toBe(matchingStoryId);
    });

    it("uses AND semantics for multiple tags and ignores duplicate tag IDs", () => {
        const sprintId = insertSprint({ name: "Sprint", startDate: "2026-01-01" });
        const bothTagsStory = insertStory({ sprintId, description: "Both tags" });
        const oneTagStory = insertStory({ sprintId, description: "One tag only" });
        const backendTag = insertTag("backend");
        const securityTag = insertTag("security");

        attachStoryTag(bothTagsStory, backendTag);
        attachStoryTag(bothTagsStory, securityTag);
        attachStoryTag(oneTagStory, backendTag);

        const results = search({ query: "tag", tagIds: [backendTag, securityTag, securityTag] });
        expect(results.stories.map((story) => story.id)).toEqual([bothTagsStory]);
    });

    it("rejects malformed and unknown tag IDs", () => {
        const sprintId = insertSprint({ name: "Sprint", startDate: "2026-01-01" });
        insertStory({ sprintId, description: "Some story" });
        const knownTagId = insertTag("known");

        expect(() => search({ tagIds: [knownTagId, -1] })).toThrow("tagId must contain positive integer IDs");
        expect(() => search({ tagIds: [knownTagId + 1000] })).toThrow("tagId contains unknown IDs");
    });

    it("applies exact case-insensitive project filtering through owning sprint", () => {
        const sprintA = insertSprint({ name: "A", startDate: "2026-01-01", comment: "authentication", project: "Nebula" });
        const sprintB = insertSprint({ name: "B", startDate: "2026-02-01", project: "Atlas" });

        const storyA = insertStory({ sprintId: sprintA, description: "authentication" });
        insertStory({ sprintId: sprintB, description: "authentication" });

        insertSubtask({ storyId: storyA, title: "authentication task" });

        const results = search({ query: "authentication", project: "neBula" });
        expect(results.sprints).toHaveLength(1);
        expect(results.sprints[0].project).toBe("Nebula");
        expect(results.stories).toHaveLength(1);
        expect(results.subtasks).toHaveLength(1);

        expect(() => search({ query: "authentication", project: "Nebu" })).toThrow("unknown project");
    });

    it("keeps completed sprint history searchable", () => {
        const closedSprintId = insertSprint({
            name: "Legacy Sprint",
            startDate: "2020-01-01",
            endDate: "2020-01-14",
            comment: "Completed work",
            project: "Archive",
        });
        const storyId = insertStory({ sprintId: closedSprintId, description: "Legacy auth migration" });
        insertSubtask({ storyId, title: "Legacy task" });

        const results = search({ query: "legacy" });
        expect(results.sprints).toHaveLength(1);
        expect(results.stories).toHaveLength(1);
        expect(results.subtasks).toHaveLength(1);
    });

    it("applies entity filter, story filter, and subtask type filter", () => {
        const sprintId = insertSprint({ name: "Sprint", startDate: "2026-01-01" });
        const storyA = insertStory({ sprintId, description: "Auth story" });
        const storyB = insertStory({ sprintId, description: "Another auth story" });

        insertSubtask({ storyId: storyA, title: "Auth feature", type: "feature" });
        insertSubtask({ storyId: storyA, title: "Auth bug", type: "bugfix" });
        insertSubtask({ storyId: storyB, title: "Auth story B feature", type: "feature" });

        const entityFiltered = search({ query: "auth", entities: ["subtask"] });
        expect(entityFiltered.sprints).toEqual([]);
        expect(entityFiltered.stories).toEqual([]);
        expect(entityFiltered.subtasks).toHaveLength(3);

        const filtered = search({
            query: "auth",
            entities: ["subtask"],
            storyId: storyA,
            subtaskType: "bugfix",
        });
        expect(filtered.subtasks).toHaveLength(1);
        expect(filtered.subtasks[0].type).toBe("bugfix");
        expect(filtered.subtasks[0].storyId).toBe(storyA);
    });

    it("caps results to 50 per entity group", () => {
        const sprintId = insertSprint({ name: "Sprint", startDate: "2026-01-01" });
        const storyId = insertStory({ sprintId, description: "bulk story" });

        for (let index = 0; index < 60; index += 1) {
            insertSubtask({ storyId, title: `bulk result ${index}` });
        }

        const results = search({ query: "bulk" });
        expect(results.subtasks).toHaveLength(50);
    });
});


