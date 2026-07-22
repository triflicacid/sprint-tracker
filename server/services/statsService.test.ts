import { describe, it, expect } from "vitest";
import { db } from "../db/connection.js";
import {
    getSprintStats,
    getStatusBreakdown,
    getDayActivity,
    getAllDayActivity,
    getCalendarEntries,
    getComplexityTiming,
    getVelocityHistory,
} from "./statsService.js";

function insertSprint(startDate: string, endDate: string | null = null) {
    const result = db
        .prepare("INSERT INTO sprints (name, start_date, end_date) VALUES ('S', ?, ?)")
        .run(startDate, endDate);
    return Number(result.lastInsertRowid);
}

function insertStory(sprintId: number, jiraKey: string | null = null, isBug = false) {
    const result = db
        .prepare(
            "INSERT INTO stories (sprint_id, jira_url, jira_key, description, is_bug) VALUES (?, 'https://x', ?, 'story', ?)"
        )
        .run(sprintId, jiraKey, isBug ? 1 : 0);
    return Number(result.lastInsertRowid);
}

function insertSubtask(
    storyId: number,
    fields: {
        branchName?: string;
        status?: string;
        url?: string | null;
        repoName?: string | null;
        complexityRating?: number | null;
        type?: string;
    } = {}
) {
    const result = db
        .prepare(
            `INSERT INTO subtasks (story_id, title, branch_name, status, url, repo_name, complexity_rating, type)
             VALUES (?, 'sub', ?, ?, ?, ?, ?, ?)`
        )
        .run(
            storyId,
            fields.branchName ?? "(unknown)",
            fields.status ?? "NEW",
            fields.url ?? null,
            fields.repoName ?? null,
            fields.complexityRating ?? null,
            fields.type ?? "unknown"
        );
    return Number(result.lastInsertRowid);
}

function insertHistory(subtaskId: number, status: string, changedAt: string, releaseVersion: string | null = null) {
    db.prepare(
        "INSERT INTO status_history (entity_type, entity_id, status, release_version, changed_at) VALUES ('subtask', ?, ?, ?, ?)"
    ).run(subtaskId, status, releaseVersion, changedAt);
}

function setStoryPoints(storyId: number, points: number | null) {
    db.prepare("UPDATE stories SET story_points = ? WHERE id = ?").run(points, storyId);
}

describe("get sprint stats", () => {
    it("counts prs, stories, and repo distribution", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId, { url: "https://github.com/org/a/pull/1", repoName: "a" });
        insertSubtask(storyId, { url: "https://github.com/org/a/pull/2", repoName: "a" });
        insertSubtask(storyId, { url: "https://github.com/org/b/pull/1", repoName: "b" });
        insertSubtask(storyId, {}); // no pr yet, excluded from pr count and repo counts

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

    it("counts stories flagged as bugs separately from the total story count", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        insertStory(sprintId, null, true);
        insertStory(sprintId, null, true);
        insertStory(sprintId);

        const stats = getSprintStats(sprintId);
        expect(stats.storyCount).toBe(3);
        expect(stats.bugCount).toBe(2);
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

    it("is unaffected by the story row's own created_at", () => {
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
        insertSubtask(storyId); // new, no status_history entries inserted here

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

    it("returns an empty subtask type counts array when there are no subtasks", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        insertStory(sprintId);

        const stats = getSprintStats(sprintId);
        expect(stats.subtaskTypeCounts).toEqual([]);
    });

    it("counts subtasks by type and orders by count descending", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId, { type: "feature" });
        insertSubtask(storyId, { type: "feature" });
        insertSubtask(storyId, { type: "feature" });
        insertSubtask(storyId, { type: "bugfix" });
        insertSubtask(storyId, { type: "bugfix" });
        insertSubtask(storyId, { type: "spike" });

        const stats = getSprintStats(sprintId);
        expect(stats.subtaskTypeCounts[0]).toEqual({ type: "feature", count: 3 });
        expect(stats.subtaskTypeCounts[1]).toEqual({ type: "bugfix", count: 2 });
        expect(stats.subtaskTypeCounts[2]).toEqual({ type: "spike", count: 1 });
    });

    it("counts unknown-type subtasks in the type breakdown", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId, { type: "unknown" });
        insertSubtask(storyId, { type: "unknown" });

        const stats = getSprintStats(sprintId);
        const unknownEntry = stats.subtaskTypeCounts.find((e) => e.type === "unknown");
        expect(unknownEntry?.count).toBe(2);
    });

    it("only counts subtasks belonging to the requested sprint", () => {
        const sprintA = insertSprint("2026-01-01", "2026-01-31");
        const sprintB = insertSprint("2026-02-01", "2026-02-28");
        insertSubtask(insertStory(sprintA), { type: "feature" });
        insertSubtask(insertStory(sprintB), { type: "feature" });
        insertSubtask(insertStory(sprintB), { type: "feature" });

        const statsA = getSprintStats(sprintA);
        expect(statsA.subtaskTypeCounts).toEqual([{ type: "feature", count: 1 }]);

        const statsB = getSprintStats(sprintB);
        expect(statsB.subtaskTypeCounts).toEqual([{ type: "feature", count: 2 }]);
    });
});

describe("get complexity timing", () => {
    it("plots each rated, done subtask's running time against its complexity rating", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId, "NEB-1");
        const subtaskId = insertSubtask(storyId, { status: "DONE", complexityRating: 3 });
        insertHistory(subtaskId, "WIP", "2026-01-03 10:00:00");
        insertHistory(subtaskId, "DONE", "2026-01-05 10:00:00");

        const result = getComplexityTiming(sprintId);
        expect(result.points).toEqual([
            { subtaskId, storyId, storyLabel: "NEB-1", complexityRating: 3, runningTimeDays: 2 },
        ]);
        expect(result.ratingCounts).toEqual({ 3: 1 });
        expect(result.unratedCount).toBe(0);
        expect(result.inProgressRatedCount).toBe(0);
        expect(result.storyComplexity).toEqual([{ storyId, storyLabel: "NEB-1", totalComplexity: 3 }]);
    });

    it("excludes unrated subtasks from points/rating counts, but counts them as unrated", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId, { status: "DONE" }); // no complexity rating

        const result = getComplexityTiming(sprintId);
        expect(result.points).toEqual([]);
        expect(result.unratedCount).toBe(1);
        expect(result.storyComplexity).toEqual([]);
    });

    it("excludes rated subtasks that aren't done yet, but counts them separately", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        const subtaskId = insertSubtask(storyId, { status: "WIP", complexityRating: 4 });
        insertHistory(subtaskId, "WIP", "2026-01-03 10:00:00");

        const result = getComplexityTiming(sprintId);
        expect(result.points).toEqual([]);
        expect(result.ratingCounts).toEqual({ 4: 1 });
        expect(result.inProgressRatedCount).toBe(1);
        expect(result.storyComplexity).toEqual([]);
    });

    it("sums complexity across a story's rated, done subtasks", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId, "NEB-2");
        const subtaskA = insertSubtask(storyId, { status: "DONE", complexityRating: 2 });
        insertHistory(subtaskA, "WIP", "2026-01-01 10:00:00");
        insertHistory(subtaskA, "DONE", "2026-01-02 10:00:00");
        const subtaskB = insertSubtask(storyId, { status: "DONE", complexityRating: 5 });
        insertHistory(subtaskB, "WIP", "2026-01-01 10:00:00");
        insertHistory(subtaskB, "DONE", "2026-01-03 10:00:00");

        const result = getComplexityTiming(sprintId);
        expect(result.storyComplexity).toEqual([{ storyId, storyLabel: "NEB-2", totalComplexity: 7 }]);
    });

    it("excludes a done, rated subtask that has no recorded status history to time it from", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId, { status: "DONE", complexityRating: 3 }); // no status_history rows inserted

        const result = getComplexityTiming(sprintId);
        expect(result.points).toEqual([]);
        expect(result.ratingCounts).toEqual({ 3: 1 });
    });
});

describe("get status breakdown", () => {
    it("classifies each subtask by the status it held as of each day", () => {
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

    it("rolls subtask statuses up to story status", () => {
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

    it("deduces the current status for a subtask with no history at all, rather than assuming new", () => {
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

describe("get day activity", () => {
    it("backfills every active day, not just transition days", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId, "NEB-1");
        const subtaskId = insertSubtask(storyId, { branchName: "feature/x" });
        insertHistory(subtaskId, "NEW", "2026-01-01 09:00:00");
        insertHistory(subtaskId, "WIP", "2026-01-02 09:00:00");
        insertHistory(subtaskId, "DONE", "2026-01-05 09:00:00");

        const activity = getDayActivity(sprintId);
        // active from the day it left new (01-02) through the day it reached done (01-05)
        for (const date of ["2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"]) {
            expect(activity[date]).toBeDefined();
            expect(activity[date][0]).toMatchObject({ storyLabel: "NEB-1", branchName: "feature/x" });
        }
        expect(activity["2026-01-02"][0].status).toBe("WIP");
        expect(activity["2026-01-04"][0].status).toBe("WIP");
        expect(activity["2026-01-05"][0].status).toBe("DONE");
    });

    it("excludes days still in new and days after done", () => {
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

    it("contributes nothing for a subtask that never left new", () => {
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

    it("uses the last transition of a day when several happen on the same day", () => {
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

    it("deduces the current status for a subtask with no history at all, rather than assuming new", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId, "NEB-1");
        insertSubtask(storyId, { branchName: "feature/x", status: "WIP" }); // no status_history rows inserted

        const activity = getDayActivity(sprintId);
        for (const date of ["2026-01-01", "2026-01-05", "2026-01-10"]) {
            expect(activity[date]).toBeDefined();
            expect(activity[date][0]).toMatchObject({ storyLabel: "NEB-1", branchName: "feature/x", status: "WIP" });
        }
    });

    it("still contributes nothing for a subtask with no history at all that is still in new", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId); // status defaults to new, no status_history rows inserted

        const activity = getDayActivity(sprintId);
        expect(Object.keys(activity)).toHaveLength(0);
    });
});

describe("get all day activity", () => {
    it("combines activity across multiple sprints, not just one", () => {
        const sprintA = insertSprint("2026-01-01", "2026-01-10");
        const sprintB = insertSprint("2026-03-01", "2026-03-10");
        // subtask a reaches done so its active range does not run through
        // "today" and bleed into subtask b's window below
        const subtaskA = insertSubtask(insertStory(sprintA, "NEB-1"), { branchName: "feature/a" });
        insertHistory(subtaskA, "NEW", "2026-01-01 09:00:00");
        insertHistory(subtaskA, "WIP", "2026-01-02 09:00:00");
        insertHistory(subtaskA, "DONE", "2026-01-03 09:00:00");
        const subtaskB = insertSubtask(insertStory(sprintB, "NEB-2"), { branchName: "feature/b" });
        insertHistory(subtaskB, "NEW", "2026-03-01 09:00:00");
        insertHistory(subtaskB, "WIP", "2026-03-02 09:00:00");
        insertHistory(subtaskB, "DONE", "2026-03-03 09:00:00");

        const activity = getAllDayActivity();
        expect(activity["2026-01-02"][0]).toMatchObject({ storyLabel: "NEB-1", branchName: "feature/a" });
        expect(activity["2026-03-02"][0]).toMatchObject({ storyLabel: "NEB-2", branchName: "feature/b" });
    });

    it("excludes days still in new and days after done", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const subtaskId = insertSubtask(insertStory(sprintId));
        insertHistory(subtaskId, "NEW", "2026-01-01 09:00:00");
        insertHistory(subtaskId, "WIP", "2026-01-02 09:00:00");
        insertHistory(subtaskId, "DONE", "2026-01-03 09:00:00");

        const activity = getAllDayActivity();
        expect(activity["2026-01-01"]).toBeUndefined();
        expect(activity["2026-01-06"]).toBeUndefined();
    });

    it("contributes nothing for a subtask that never left new", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-10");
        const subtaskId = insertSubtask(insertStory(sprintId));
        insertHistory(subtaskId, "NEW", "2026-01-01 09:00:00");

        const activity = getAllDayActivity();
        expect(Object.keys(activity)).toHaveLength(0);
    });

    it("falls back to the subtask's own sprint start date for an implied-active subtask with no history at all", () => {
        // use a fixed past start date so this remains stable across run dates
        // with no done entry, the active range is capped at "today"
        const sprintId = insertSprint("2020-01-01", "2020-01-10");
        const storyId = insertStory(sprintId, "NEB-1");
        insertSubtask(storyId, { branchName: "feature/x", status: "WIP" }); // no status_history rows

        const activity = getAllDayActivity();
        expect(activity["2020-01-01"]).toBeDefined();
        expect(activity["2020-01-01"][0]).toMatchObject({ storyLabel: "NEB-1", branchName: "feature/x", status: "WIP" });
    });
});

describe("get calendar entries", () => {
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

    it("filters by story id", () => {
        const sprintA = insertSprint("2026-01-01");
        const sprintB = insertSprint("2026-02-01");
        const storyA = insertStory(sprintA);
        insertStory(sprintB);

        const entries = getCalendarEntries({ storyId: storyA });
        expect(entries.map((e) => e.sprintId)).toEqual([sprintA]);
    });
});

describe("get velocity history", () => {
    it("sums story points over done stories, excluding unpointed ones from the sum but counting them", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const pointedDone = insertStory(sprintId);
        insertSubtask(pointedDone, { status: "DONE" });
        setStoryPoints(pointedDone, 5);
        const unpointedDone = insertStory(sprintId);
        insertSubtask(unpointedDone, { status: "DONE" });
        const pointedNotDone = insertStory(sprintId);
        insertSubtask(pointedNotDone, { status: "WIP" });
        setStoryPoints(pointedNotDone, 8);

        const [point] = getVelocityHistory(sprintId, { mode: "all" });
        expect(point.completedPoints).toBe(5);
        expect(point.unpointedDoneStoryCount).toBe(1);
        expect(point.completedStoryCount).toBe(2);
    });

    it("counts done subtasks across the whole sprint, not just done stories", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        insertSubtask(storyId, { status: "DONE" });
        insertSubtask(storyId, { status: "WIP" }); // story isn't DONE, but this subtask still counts

        const [point] = getVelocityHistory(sprintId, { mode: "all" });
        expect(point.completedSubtaskCount).toBe(1);
        expect(point.completedStoryCount).toBe(0);
    });

    it("a story with no subtasks (jira only) is never counted as done", () => {
        const sprintId = insertSprint("2026-01-01", "2026-01-31");
        const storyId = insertStory(sprintId);
        setStoryPoints(storyId, 3);

        const [point] = getVelocityHistory(sprintId, { mode: "all" });
        expect(point.completedStoryCount).toBe(0);
        expect(point.completedPoints).toBe(0);
    });

    it("mode 'all' returns every sprint, chronological by start date", () => {
        const sprintB = insertSprint("2026-02-01", "2026-02-28");
        const sprintA = insertSprint("2026-01-01", "2026-01-31");

        const points = getVelocityHistory(sprintA, { mode: "all" });
        expect(points.map((point) => point.sprintId)).toEqual([sprintA, sprintB]);
    });

    it("mode 'range' only includes sprints starting within [from, to]", () => {
        const sprintA = insertSprint("2026-01-01", "2026-01-31");
        const sprintB = insertSprint("2026-02-01", "2026-02-28");
        insertSprint("2026-03-01", "2026-03-31");

        const points = getVelocityHistory(sprintA, { mode: "range", from: "2026-01-01", to: "2026-02-15" });
        expect(points.map((point) => point.sprintId)).toEqual([sprintA, sprintB]);
    });

    it("mode 'lastn' returns the anchor sprint plus its n-1 most recent predecessors, chronological", () => {
        insertSprint("2026-01-01", "2026-01-31");
        const sprintB = insertSprint("2026-02-01", "2026-02-28");
        const sprintC = insertSprint("2026-03-01", "2026-03-31");
        insertSprint("2026-04-01", "2026-04-30"); // after the anchor, excluded

        const points = getVelocityHistory(sprintC, { mode: "lastN", n: 2 });
        expect(points.map((point) => point.sprintId)).toEqual([sprintB, sprintC]);
    });

    it("mode 'lastn' returns an empty list when the anchor sprint doesn't exist", () => {
        expect(getVelocityHistory(999999, { mode: "lastN", n: 5 })).toEqual([]);
    });
});
