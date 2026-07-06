import { describe, it, expect } from "vitest";
import { db } from "../db/connection.js";
import { buildMarkdownExport } from "./exportService.js";
import { createSubtask, updateSubtask } from "./subtaskService.js";
import { findOrCreateTag, attachTag } from "./tagService.js";
import type { MarkdownExportFields } from "../../shared/types.js";

function allFields(overrides: Partial<{ story: Partial<MarkdownExportFields["story"]>; subtask: Partial<MarkdownExportFields["subtask"]> }> = {}): MarkdownExportFields {
    return {
        story: {
            jiraKey: true,
            title: true,
            status: true,
            tags: true,
            awaitingMoreSubtasks: true,
            ...overrides.story,
        },
        subtask: {
            title: true,
            comment: true,
            branchName: true,
            prUrl: true,
            status: true,
            repoName: true,
            complexityRating: true,
            releaseVersion: true,
            createdAt: true,
            ...overrides.subtask,
        },
    };
}

function insertSprint(name: string, startDate: string, endDate: string | null = null): number {
    const result = db
        .prepare("INSERT INTO sprints (name, start_date, end_date) VALUES (?, ?, ?)")
        .run(name, startDate, endDate);
    return Number(result.lastInsertRowid);
}

function insertStory(
    sprintId: number,
    fields: { jiraUrl?: string; jiraKey?: string | null; description?: string; jiraTitle?: string | null; awaitingMoreSubtasks?: boolean } = {}
): number {
    const result = db
        .prepare(
            `INSERT INTO stories (sprint_id, jira_url, jira_key, description, jira_title, awaiting_more_subtasks)
             VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
            sprintId,
            fields.jiraUrl ?? "https://example.atlassian.net/browse/EXP-1",
            fields.jiraKey === undefined ? "EXP-1" : fields.jiraKey,
            fields.description ?? "story description",
            fields.jiraTitle ?? null,
            fields.awaitingMoreSubtasks ? 1 : 0
        );
    return Number(result.lastInsertRowid);
}

describe("buildMarkdownExport", () => {
    it("renders the sprint heading with its date range", () => {
        const sprintId = insertSprint("Sprint A", "2026-01-01", "2026-01-14");
        const markdown = buildMarkdownExport([sprintId], allFields());
        expect(markdown).toContain("# Sprint A (2026-01-01 – 2026-01-14)");
    });

    it("shows 'present' for an open-ended sprint", () => {
        const sprintId = insertSprint("Sprint B", "2026-01-01", null);
        const markdown = buildMarkdownExport([sprintId], allFields());
        expect(markdown).toContain("# Sprint B (2026-01-01 – present)");
    });

    it("renders a story heading with jira key, title and status when all are selected", () => {
        const sprintId = insertSprint("Sprint C", "2026-01-01");
        insertStory(sprintId, { jiraKey: "EXP-1", description: "story text" });
        const markdown = buildMarkdownExport([sprintId], allFields());
        expect(markdown).toContain("## EXP-1: story text [jira only]");
    });

    it("falls back to jiraUrl when jiraKey is unset but jiraKey field is selected", () => {
        const sprintId = insertSprint("Sprint D", "2026-01-01");
        insertStory(sprintId, { jiraKey: null, jiraUrl: "https://x/browse/NOKEY", description: "no key story" });
        const markdown = buildMarkdownExport([sprintId], allFields());
        expect(markdown).toContain("## https://x/browse/NOKEY: no key story");
    });

    it("prefers jiraTitle over description when both are present", () => {
        const sprintId = insertSprint("Sprint E", "2026-01-01");
        insertStory(sprintId, { description: "raw description", jiraTitle: "cached jira title" });
        const markdown = buildMarkdownExport([sprintId], allFields());
        expect(markdown).toContain("cached jira title");
        expect(markdown).not.toContain("raw description");
    });

    it("falls back to 'Story {id}' when neither jiraKey nor title is selected", () => {
        const sprintId = insertSprint("Sprint F", "2026-01-01");
        const storyId = insertStory(sprintId);
        const markdown = buildMarkdownExport([sprintId], allFields({ story: { jiraKey: false, title: false } }));
        expect(markdown).toContain(`## Story ${storyId}`);
    });

    it("omits the tags line when the story has no tags, even if tags is selected", () => {
        const sprintId = insertSprint("Sprint G", "2026-01-01");
        insertStory(sprintId);
        const markdown = buildMarkdownExport([sprintId], allFields());
        expect(markdown).not.toContain("tags:");
    });

    it("includes the tags line when selected and the story has tags", () => {
        const sprintId = insertSprint("Sprint H", "2026-01-01");
        const storyId = insertStory(sprintId);
        const tag = findOrCreateTag("backend", "custom");
        attachTag("story", storyId, tag.id);
        const markdown = buildMarkdownExport([sprintId], allFields());
        expect(markdown).toContain("tags: backend");
    });

    it("shows 'awaiting more subtasks' only when true and selected", () => {
        const sprintId = insertSprint("Sprint I", "2026-01-01");
        insertStory(sprintId, { awaitingMoreSubtasks: true });
        const withField = buildMarkdownExport([sprintId], allFields());
        expect(withField).toContain("awaiting more subtasks: yes");

        const withoutField = buildMarkdownExport([sprintId], allFields({ story: { awaitingMoreSubtasks: false } }));
        expect(withoutField).not.toContain("awaiting more subtasks");
    });

    it("does not show 'awaiting more subtasks' when false, even if selected", () => {
        const sprintId = insertSprint("Sprint J", "2026-01-01");
        insertStory(sprintId, { awaitingMoreSubtasks: false });
        const markdown = buildMarkdownExport([sprintId], allFields());
        expect(markdown).not.toContain("awaiting more subtasks");
    });

    it("falls back to 'Subtask {id}' when title is deselected", () => {
        const sprintId = insertSprint("Sprint K", "2026-01-01");
        const storyId = insertStory(sprintId);
        const subtask = createSubtask(storyId, { title: "real title" });
        const markdown = buildMarkdownExport([sprintId], allFields({ subtask: { title: false } }));
        expect(markdown).toContain(`- Subtask ${subtask.id}`);
        expect(markdown).not.toContain("real title");
    });

    it("includes branch/PR/repo/complexity/release details only when selected and present", () => {
        const sprintId = insertSprint("Sprint L", "2026-01-01");
        const storyId = insertStory(sprintId);
        const subtask = createSubtask(storyId, { title: "add endpoint" });
        updateSubtask(subtask.id, { status: "WIP", branchName: "feature/x" });
        updateSubtask(subtask.id, {
            status: "IN_PR",
            prUrl: "https://github.com/org/repo/pull/1",
            complexityRating: 3,
            releaseVersion: "v1.0.0",
        });

        const full = buildMarkdownExport([sprintId], allFields());
        expect(full).toContain("  - branch: feature/x @ https://github.com/org/repo/pull/1");
        expect(full).toContain("  - repo: repo");
        expect(full).toContain("  - complexity: 3");
        expect(full).toContain("  - release: v1.0.0");

        const minimal = buildMarkdownExport(
            [sprintId],
            allFields({
                subtask: {
                    branchName: false,
                    prUrl: false,
                    repoName: false,
                    complexityRating: false,
                    releaseVersion: false,
                    createdAt: false,
                },
            })
        );
        expect(minimal).not.toContain("branch:");
        expect(minimal).not.toContain("PR:");
        expect(minimal).not.toContain("repo:");
        expect(minimal).not.toContain("complexity:");
        expect(minimal).not.toContain("release:");
        expect(minimal).not.toContain("created:");
    });

    it("shows the PR link on its own sub-bullet when branch name is deselected", () => {
        const sprintId = insertSprint("Sprint L2", "2026-01-01");
        const storyId = insertStory(sprintId);
        const subtask = createSubtask(storyId, { title: "add endpoint" });
        updateSubtask(subtask.id, { status: "WIP", branchName: "feature/x" });
        updateSubtask(subtask.id, { status: "IN_PR", prUrl: "https://github.com/org/repo/pull/1" });

        const markdown = buildMarkdownExport([sprintId], allFields({ subtask: { branchName: false } }));
        expect(markdown).toContain("  - PR: https://github.com/org/repo/pull/1");
        expect(markdown).not.toContain("feature/x");
    });

    it("puts each subtask detail on its own indented sub-bullet, nested under the subtask's own bullet", () => {
        const sprintId = insertSprint("Sprint L3", "2026-01-01");
        const storyId = insertStory(sprintId);
        const subtask = createSubtask(storyId, { title: "add endpoint" });
        updateSubtask(subtask.id, { status: "WIP", branchName: "feature/x" });
        updateSubtask(subtask.id, { status: "IN_PR", prUrl: "https://github.com/org/repo/pull/1", complexityRating: 3 });

        const markdown = buildMarkdownExport([sprintId], allFields());
        const lines = markdown.split("\n");
        const headingIndex = lines.findIndex((line) => line.startsWith("- add endpoint"));
        expect(headingIndex).toBeGreaterThanOrEqual(0);
        expect(lines[headingIndex + 1]).toMatch(/^ {2}- branch: feature\/x @ https:\/\/github\.com\/org\/repo\/pull\/1$/);
        expect(lines[headingIndex + 2]).toMatch(/^ {2}- repo: repo$/);
        expect(lines[headingIndex + 3]).toMatch(/^ {2}- complexity: 3$/);
    });

    it("renders the comment as an indented blockquote only when selected and present", () => {
        const sprintId = insertSprint("Sprint M", "2026-01-01");
        const storyId = insertStory(sprintId);
        const subtask = createSubtask(storyId, { title: "add endpoint" });
        updateSubtask(subtask.id, { comment: "waiting on infra" });

        const withComment = buildMarkdownExport([sprintId], allFields());
        expect(withComment).toContain("  > waiting on infra");

        const withoutComment = buildMarkdownExport([sprintId], allFields({ subtask: { comment: false } }));
        expect(withoutComment).not.toContain("waiting on infra");
    });

    it("uses friendly status labels rather than raw status ids", () => {
        const sprintId = insertSprint("Sprint N", "2026-01-01");
        const storyId = insertStory(sprintId, { awaitingMoreSubtasks: true });
        const subtask = createSubtask(storyId, { title: "add endpoint" });
        updateSubtask(subtask.id, { status: "WIP", branchName: "feature/x" });

        const markdown = buildMarkdownExport([sprintId], allFields());
        expect(markdown).toContain("[work remaining]");
        expect(markdown).toContain("[wip]");
        expect(markdown).not.toContain("WORK_REMAINING");
        expect(markdown).not.toContain("[WIP]");
    });

    it("joins multiple sprints with a separator, in the given order", () => {
        const sprintOneId = insertSprint("First Sprint", "2026-01-01");
        const sprintTwoId = insertSprint("Second Sprint", "2026-02-01");
        const markdown = buildMarkdownExport([sprintTwoId, sprintOneId], allFields());

        const secondIndex = markdown.indexOf("# Second Sprint");
        const firstIndex = markdown.indexOf("# First Sprint");
        expect(secondIndex).toBeGreaterThanOrEqual(0);
        expect(firstIndex).toBeGreaterThan(secondIndex);
        expect(markdown).toContain("\n\n---\n\n");
    });

    it("silently skips an unknown sprint id", () => {
        const sprintId = insertSprint("Sprint O", "2026-01-01");
        const markdown = buildMarkdownExport([sprintId, 999999], allFields());
        expect(markdown).toContain("Sprint O");
        expect(markdown.split("---")).toHaveLength(1);
    });
});
