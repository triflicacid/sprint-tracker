import { describe, it, expect } from "vitest";
import { db } from "../db/connection.js";
import { getSprintStats, getStatusBreakdown, getDayActivity, getCalendarEntries } from "./statsService.js";

function insertSprint(startDate: string, endDate: string | null = null) {
    const result = db
        .prepare("INSERT INTO sprints (name, start_date, end_date) VALUES ('S', ?, ?)")
        .run(startDate, endDate);
    return Number(result.lastInsertRowid);
}

function insertStory(sprintId: number, jiraKey: string | null = null) {
    const result = db
        .prepare("INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES (?, 'https://x', ?, 'story')")
        .run(sprintId, jiraKey);
    return Number(result.lastInsertRowid);
}

function insertSubtask(
    storyId: number,
    fields: { branchName?: string; status?: string; url?: string | null; repoName?: string | null } = {}
) {
    const result = db
        .prepare(
            `INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name)
             VALUES (?, 'sub', ?, ?, ?, ?)`
        )
        .run(storyId, fields.branchName ?? "(unknown)", fields.status ?? "NEW", fields.url ?? null, fields.repoName ?? null);
    return Number(result.lastInsertRowid);
}

function insertHistory(subtaskId: number, status: string, changedAt: string, releaseVersion: string | null = null) {
    db.prepare(
        "INSERT INTO status_history (entity_type, entity_id, status, release_version, changed_at) VALUES ('subtask', ?, ?, ?, ?)"
    ).run(subtaskId, status, releaseVersion, changedAt);
}

describe("getSprintStats", () => {
    it("counts prs, stories, and repo distribution", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId, { url: "https://github.com/org/a/pull/1", repoName: "a" });
        insertSubtask(storyId, { url: "https://github.com/org/a/pull/2", repoName: "a" });
        insertSubtask(storyId, { url: "https://github.com/org/b/pull/1", repoName: "b" });
        insertSubtask(storyId, {}); // no pr yet, excluded from prCount/repoCounts

        const stats = getSprintStats(sprintId);
        expect(stats.storyCount).toBe(1);
        expect(stats.prCount).toBe(3);
        expect(stats.repoCounts).toEqual(
            expect.arrayContaining([
                { repoName: "a", count: 2, proportion: 2 / 3 },
                { repoName: "b", count: 1, proportion: 1 / 3 },
            ])
        );
    });

    it("computes story time in days from its first recorded activity to its last", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        const subtaskId = insertSubtask(storyId);
        insertHistory(subtaskId, "WIP", "2026-01-03 10:00:00");
        insertHistory(subtaskId, "DONE", "2026-01-05 10:00:00");

        const stats = getSprintStats(sprintId);
        expect(stats.storyTimeDays).toHaveLength(1);
        expect(stats.storyTimeDays[0].storyId).toBe(storyId);
        expect(stats.storyTimeDays[0].days).toBe(2);
    });

    it("is unaffected by the story row's own created_at, which can postdate its subtasks' history entirely", () => {
        // e.g. bulk-imported/seeded data, where the story row is created "now"
        // but its status history reaches back months - created_at must not be
        // used as the start of the measured window in that case.
        const sprintId = insertSprint("2026-01-01", "2026-12-31");
        const storyId = insertStory(sprintId);
        const subtaskId = insertSubtask(storyId);
        insertHistory(subtaskId, "WIP", "2026-01-03 10:00:00");
        insertHistory(subtaskId, "DONE", "2026-01-10 10:00:00");

        const stats = getSprintStats(sprintId);
        const story = stats.storyTimeDays.find((entry) => entry.storyId === storyId);
        expect(story?.days).toBe(7);
    });

    it("falls back to created_at (0 days) for a story with no subtask activity yet", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId); // NEW, no status_history beyond none inserted here

        const stats = getSprintStats(sprintId);
        const story = stats.storyTimeDays.find((entry) => entry.storyId === storyId);
        expect(story?.days).toBe(0);
    });

    it("labels a story by its jira key, falling back to its id when there is none", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyWithKey = insertStory(sprintId, "NEB-42");
        const storyWithoutKey = insertStory(sprintId);

        const stats = getSprintStats(sprintId);
        const byId = Object.fromEntries(stats.storyTimeDays.map((story) => [story.storyId, story.storyLabel]));
        expect(byId[storyWithKey]).toBe("NEB-42");
        expect(byId[storyWithoutKey]).toBe(`#${storyWithoutKey}`);
    });
});

describe("getStatusBreakdown", () => {
    it("classifies each subtask by the status it held as of each day (subtask granularity)", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-05");
        const storyId = insertStory(sprintId);
        const subtaskId = insertSubtask(storyId);
        insertHistory(subtaskId, "NEW", "2026-01-01 09:00:00");
        insertHistory(subtaskId, "WIP", "2026-01-03 09:00:00");

        const points = getStatusBreakdown(sprintId, "subtask");
        const byDate = Object.fromEntries(points.map((point) => [point.date, point.counts]));
        expect(byDate["2026-01-01"].NEW).toBe(1);
        expect(byDate["2026-01-02"].NEW).toBe(1);
        expect(byDate["2026-01-03"].WIP).toBe(1);
        expect(byDate["2026-01-05"].WIP).toBe(1);
    });

    it("rolls subtask statuses up to story status (story granularity)", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-02");
        const storyId = insertStory(sprintId);
        const subtaskId = insertSubtask(storyId);
        insertHistory(subtaskId, "DONE", "2026-01-01 09:00:00");

        const points = getStatusBreakdown(sprintId, "story");
        const day1 = points.find((point) => point.date === "2026-01-01");
        expect(day1?.counts.DONE).toBe(1);
    });

    it("returns an empty list for a missing sprint", () => {
        expect(getStatusBreakdown(999999, "subtask")).toEqual([]);
    });

    it("deduces the current status for a subtask with no history at all, rather than assuming NEW", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-05");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId, { status: "DONE" }); // no status_history rows inserted

        const points = getStatusBreakdown(sprintId, "subtask");
        const byDate = Object.fromEntries(points.map((point) => [point.date, point.counts]));
        expect(byDate["2026-01-01"].DONE).toBe(1);
        expect(byDate["2026-01-01"].NEW).toBe(0);
        expect(byDate["2026-01-05"].DONE).toBe(1);
    });
});

describe("getDayActivity", () => {
    it("backfills every active day, not just transition days", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId, "NEB-1");
        const subtaskId = insertSubtask(storyId, { branchName: "feature/x" });
        insertHistory(subtaskId, "NEW", "2026-01-01 09:00:00");
        insertHistory(subtaskId, "WIP", "2026-01-02 09:00:00");
        insertHistory(subtaskId, "DONE", "2026-01-05 09:00:00");

        const activity = getDayActivity(sprintId);
        // active from the day it left NEW (01-02) through the day it reached DONE (01-05)
        for (const date of ["2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"]) {
            expect(activity[date]).toBeDefined();
            expect(activity[date][0]).toMatchObject({ storyLabel: "NEB-1", branchName: "feature/x" });
        }
        expect(activity["2026-01-02"][0].status).toBe("WIP");
        expect(activity["2026-01-04"][0].status).toBe("WIP");
        expect(activity["2026-01-05"][0].status).toBe("DONE");
    });

    it("excludes days still in NEW and days after DONE", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId);
        const subtaskId = insertSubtask(storyId);
        insertHistory(subtaskId, "NEW", "2026-01-01 09:00:00");
        insertHistory(subtaskId, "WIP", "2026-01-02 09:00:00");
        insertHistory(subtaskId, "DONE", "2026-01-03 09:00:00");

        const activity = getDayActivity(sprintId);
        expect(activity["2026-01-01"]).toBeUndefined();
        expect(activity["2026-01-06"]).toBeUndefined();
    });

    it("contributes nothing for a subtask that never left NEW", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId);
        const subtaskId = insertSubtask(storyId);
        insertHistory(subtaskId, "NEW", "2026-01-01 09:00:00");

        const activity = getDayActivity(sprintId);
        expect(Object.keys(activity)).toHaveLength(0);
    });

    it("includes the subtask's pr url on each active-day entry", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId);
        const subtaskId = insertSubtask(storyId, { url: "https://github.com/org/repo/pull/9" });
        insertHistory(subtaskId, "NEW", "2026-01-01 09:00:00");
        insertHistory(subtaskId, "WIP", "2026-01-02 09:00:00");

        const activity = getDayActivity(sprintId);
        expect(activity["2026-01-02"][0].prUrl).toBe("https://github.com/org/repo/pull/9");
    });

    it("uses the LAST transition of a day when several happen on the same day", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId);
        const subtaskId = insertSubtask(storyId);
        insertHistory(subtaskId, "NEW", "2026-01-01 09:00:00");
        insertHistory(subtaskId, "WIP", "2026-01-01 09:10:00");
        insertHistory(subtaskId, "PR_COMMENTS", "2026-01-05 10:00:00");
        insertHistory(subtaskId, "IN_REVIEW", "2026-01-05 17:00:00");
        insertHistory(subtaskId, "CUT_RELEASE", "2026-01-05 19:00:00");

        const activity = getDayActivity(sprintId);
        expect(activity["2026-01-05"][0].status).toBe("CUT_RELEASE");
    });

    it("deduces the current status for a subtask with no history at all, rather than assuming NEW", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId, "NEB-1");
        insertSubtask(storyId, { branchName: "feature/x", status: "WIP" }); // no status_history rows inserted

        const activity = getDayActivity(sprintId);
        for (const date of ["2026-01-01", "2026-01-05", "2026-01-10"]) {
            expect(activity[date]).toBeDefined();
            expect(activity[date][0]).toMatchObject({ storyLabel: "NEB-1", branchName: "feature/x", status: "WIP" });
        }
    });

    it("still contributes nothing for a subtask with no history at all that is still in NEW", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId); // status defaults to NEW, no status_history rows inserted

        const activity = getDayActivity(sprintId);
        expect(Object.keys(activity)).toHaveLength(0);
    });
});

describe("getCalendarEntries", () => {
    it("lists every sprint with its touched repos and tags", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId, { repoName: "checkout-web" });

        const entries = getCalendarEntries({});
        const entry = entries.find((e) => e.sprintId === sprintId);
        expect(entry?.repos).toEqual(["checkout-web"]);
    });

    it("filters by repo", () => {
        const sprintA = insertSprint("2026-01-01");
        const sprintB = insertSprint("2026-02-01");
        insertSubtask(insertStory(sprintA), { repoName: "checkout-web" });
        insertSubtask(insertStory(sprintB), { repoName: "payments-service" });

        const entries = getCalendarEntries({ repo: "checkout-web" });
        expect(entries.map((e) => e.sprintId)).toEqual([sprintA]);
    });

    it("filters by storyId", () => {
        const sprintA = insertSprint("2026-01-01");
        const sprintB = insertSprint("2026-02-01");
        const storyA = insertStory(sprintA);
        insertStory(sprintB);

        const entries = getCalendarEntries({ storyId: storyA });
        expect(entries.map((e) => e.sprintId)).toEqual([sprintA]);
    });
});
