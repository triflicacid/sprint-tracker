import { db } from "../db/connection.js";
import type {
    SprintStats,
    StatusBreakdownPoint,
    StatusBreakdownGranularity,
    CalendarEntry,
    SubtaskStatus,
    DayActivityMap,
} from "../../shared/types.js";
import { computeStoryStatus } from "./storyService.js";
import { getStatusFlow } from "./statusFlowService.js";
import { statusAsOf } from "../../shared/statusHistory.js";
import { storyStatuses, subtaskStatuses } from "../../shared/statusCatalog.js";

const SUBTASK_STATUSES = subtaskStatuses(getStatusFlow());

const STORY_STATUSES = storyStatuses(getStatusFlow());

interface RepoCountRow {
    repo_name: string;
    count: number;
}

interface StoryTimeRow {
    id: number;
    description: string;
    jira_key: string | null;
    created_at: string;
    first_activity: string | null;
    last_activity: string | null;
}

export function getSprintStats(sprintId: number) {
    const prCount = (
        db
            .prepare(
                `SELECT COUNT(*) AS count FROM subtasks
                 JOIN stories ON stories.id = subtasks.story_id
                 WHERE stories.sprint_id = ? AND subtasks.url IS NOT NULL`
            )
            .get(sprintId) as { count: number }
    ).count;

    const storyCount = (
        db.prepare("SELECT COUNT(*) AS count FROM stories WHERE sprint_id = ?").get(sprintId) as {
            count: number;
        }
    ).count;

    const repoRows = db
        .prepare(
            `SELECT subtasks.repo_name AS repo_name, COUNT(*) AS count FROM subtasks
             JOIN stories ON stories.id = subtasks.story_id
             WHERE stories.sprint_id = ? AND subtasks.repo_name IS NOT NULL
             GROUP BY subtasks.repo_name
             ORDER BY count DESC`
        )
        .all(sprintId) as RepoCountRow[];

    const repoCounts = repoRows.map((row) => ({
        repoName: row.repo_name,
        count: row.count,
        proportion: prCount === 0 ? 0 : row.count / prCount,
    }));

    const storyRows = db
        .prepare(
            `SELECT stories.id AS id, stories.description AS description, stories.jira_key AS jira_key,
                stories.created_at AS created_at,
                (SELECT MIN(status_history.changed_at) FROM status_history
                    JOIN subtasks ON subtasks.id = status_history.entity_id
                        AND status_history.entity_type = 'subtask'
                    WHERE subtasks.story_id = stories.id) AS first_activity,
                (SELECT MAX(status_history.changed_at) FROM status_history
                    JOIN subtasks ON subtasks.id = status_history.entity_id
                        AND status_history.entity_type = 'subtask'
                    WHERE subtasks.story_id = stories.id) AS last_activity
             FROM stories WHERE stories.sprint_id = ?`
        )
        .all(sprintId) as StoryTimeRow[];

    const storyTimeDays = storyRows.map((row) => {
        const start = row.first_activity ? new Date(row.first_activity) : new Date(row.created_at);
        const end = row.last_activity ? new Date(row.last_activity) : new Date();
        const days = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return {
            storyId: row.id,
            storyLabel: row.jira_key ?? `#${row.id}`,
            description: row.description,
            days: Math.round(days * 10) / 10,
        };
    });

    return { sprintId, prCount, storyCount, repoCounts, storyTimeDays } as SprintStats;
}

// per-day status tally: for each day in the sprint, count subtasks/stories
// by the status they held as of that day.
export function getStatusBreakdown(sprintId: number, granularity: StatusBreakdownGranularity) {
    const sprint = db.prepare("SELECT start_date, end_date FROM sprints WHERE id = ?").get(sprintId) as
        | { start_date: string; end_date: string | null }
        | undefined;
    if (!sprint) {
        return [];
    }

    const subtaskRows = db
        .prepare(
            `SELECT subtasks.id AS id, subtasks.story_id AS story_id, subtasks.status AS status FROM subtasks
             JOIN stories ON stories.id = subtasks.story_id
             WHERE stories.sprint_id = ?`
        )
        .all(sprintId) as { id: number; story_id: number; status: SubtaskStatus }[];

    const historyBySubtask: Map<number, { status: SubtaskStatus; changedAt: string }[]> = new Map();
    const currentStatusBySubtask: Map<number, SubtaskStatus> = new Map();
    for (const row of subtaskRows) {
        const entries = db
            .prepare(
                "SELECT status, changed_at FROM status_history WHERE entity_type = 'subtask' AND entity_id = ? ORDER BY changed_at ASC"
            )
            .all(row.id) as { status: SubtaskStatus; changed_at: string }[];
        historyBySubtask.set(row.id, entries.map((entry) => ({ status: entry.status, changedAt: entry.changed_at })));
        currentStatusBySubtask.set(row.id, row.status);
    }

    function subtaskStatusAsOf(subtaskId: number, dateString: string): SubtaskStatus {
        return statusAsOf(
            historyBySubtask.get(subtaskId) ?? [],
            dateString,
            currentStatusBySubtask.get(subtaskId) ?? "NEW"
        );
    }

    const storiesForBreakdown: { id: number; awaiting_more_subtasks: number }[] =
        granularity === "story"
            ? (db
                  .prepare("SELECT id, awaiting_more_subtasks FROM stories WHERE sprint_id = ?")
                  .all(sprintId) as { id: number; awaiting_more_subtasks: number }[])
            : [];

    const start = new Date(sprint.start_date);
    const end = sprint.end_date ? new Date(sprint.end_date) : new Date();
    const points: StatusBreakdownPoint[] = [];

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const dateString: string = cursor.toISOString().slice(0, 10);
        const counts: Record<string, number> = {};

        if (granularity === "subtask") {
            for (const status of SUBTASK_STATUSES) {
                counts[status] = 0;
            }
            for (const row of subtaskRows) {
                const status = subtaskStatusAsOf(row.id, dateString);
                counts[status] += 1;
            }
        } else {
            for (const status of STORY_STATUSES) {
                counts[status] = 0;
            }
            const subtaskStatusesByStory: Map<number, SubtaskStatus[]> = new Map();
            for (const row of subtaskRows) {
                const status = subtaskStatusAsOf(row.id, dateString);
                const list = subtaskStatusesByStory.get(row.story_id) ?? [];
                list.push(status);
                subtaskStatusesByStory.set(row.story_id, list);
            }
            for (const story of storiesForBreakdown) {
                const status = computeStoryStatus(subtaskStatusesByStory.get(story.id) ?? [], !!story.awaiting_more_subtasks);
                counts[status] += 1;
            }
        }

        points.push({ date: dateString, counts });
    }

    return points as StatusBreakdownPoint[];
}

// per-day activity for the calendar view: backfills every day a subtask
// was active with the status held that day.
// subtasks still in NEW contribute nothing.
export function getDayActivity(sprintId: number): DayActivityMap {
    const sprint = db.prepare("SELECT start_date, end_date FROM sprints WHERE id = ?").get(sprintId) as
        | { start_date: string; end_date: string | null }
        | undefined;
    if (!sprint) {
        return {};
    }

    const subtaskRows = db
        .prepare(
            `SELECT subtasks.id AS id, subtasks.branch_name AS branch_name,
                    stories.jira_key AS jira_key, stories.id AS story_id, subtasks.url AS url,
                    subtasks.status AS status
             FROM subtasks
             JOIN stories ON stories.id = subtasks.story_id
             WHERE stories.sprint_id = ?`
        )
        .all(sprintId) as {
            id: number;
            branch_name: string;
            jira_key: string | null;
            story_id: number;
            url: string | null;
            status: SubtaskStatus;
        }[];

    const sprintStart = sprint.start_date.slice(0, 10);
    const sprintEnd = (sprint.end_date ? new Date(sprint.end_date) : new Date()).toISOString().slice(0, 10);

    const result: DayActivityMap = {};

    for (const subtask of subtaskRows) {
        const entries = db
            .prepare(
                "SELECT status, changed_at FROM status_history WHERE entity_type = 'subtask' AND entity_id = ? ORDER BY changed_at ASC"
            )
            .all(subtask.id) as { status: SubtaskStatus; changed_at: string }[];

        const firstActiveEntry = entries.find((entry) => entry.status !== "NEW");
        // if no history but non-NEW, imply active to not render as NEW
        const impliedActive = entries.length === 0 && subtask.status !== "NEW";
        if (!firstActiveEntry && !impliedActive) {
            continue;
        }
        const doneEntry = entries.find((entry) => entry.status === "DONE");
        const firstActive = firstActiveEntry ? firstActiveEntry.changed_at.slice(0, 10) : sprintStart;
        const lastActive = doneEntry ? doneEntry.changed_at.slice(0, 10) : sprintEnd;

        const rangeStart = firstActive > sprintStart ? firstActive : sprintStart;
        const rangeEnd = lastActive < sprintEnd ? lastActive : sprintEnd;
        if (rangeStart > rangeEnd) {
            continue;
        }

        const historyForStatusAsOf = entries.map((entry) => ({ status: entry.status, changedAt: entry.changed_at }));

        const storyLabel: string = subtask.jira_key ?? `#${subtask.story_id}`;
        for (
            let cursor = new Date(rangeStart);
            cursor.toISOString().slice(0, 10) <= rangeEnd;
            cursor.setDate(cursor.getDate() + 1)
        ) {
            const dateString = cursor.toISOString().slice(0, 10);
            const status = statusAsOf(historyForStatusAsOf, dateString, subtask.status);
            (result[dateString] ??= []).push({
                storyLabel,
                branchName: subtask.branch_name,
                status,
                prUrl: subtask.url,
            });
        }
    }

    return result;
}

interface CalendarFilter {
    repo?: string;
    storyId?: number;
    tag?: string;
}

// builds calendar entries, one per sprint, listing the repos and tags
// touched during that sprint. filters narrow which sprints are returned.
export function getCalendarEntries(filter: CalendarFilter) {
    const sprints = db.prepare("SELECT id, name, start_date, end_date FROM sprints ORDER BY start_date ASC").all() as {
        id: number;
        name: string;
        start_date: string;
        end_date: string | null;
    }[];

    const entries: CalendarEntry[] = [];
    for (const sprint of sprints) {
        const repos = (
            db
                .prepare(
                    `SELECT DISTINCT subtasks.repo_name AS repo_name FROM subtasks
                     JOIN stories ON stories.id = subtasks.story_id
                     WHERE stories.sprint_id = ? AND subtasks.repo_name IS NOT NULL`
                )
                .all(sprint.id) as { repo_name: string }[]
        ).map((row) => row.repo_name);

        const tags = (
            db
                .prepare(
                    `SELECT DISTINCT tags.name AS name FROM tags
                     JOIN entity_tags ON entity_tags.tag_id = tags.id
                     JOIN stories ON stories.id = entity_tags.entity_id AND entity_tags.entity_type = 'story'
                     WHERE stories.sprint_id = ?`
                )
                .all(sprint.id) as { name: string }[]
        ).map((row) => row.name);

        if (filter.repo && !repos.includes(filter.repo)) {
            continue;
        }
        if (filter.tag && !tags.includes(filter.tag)) {
            continue;
        }
        if (filter.storyId) {
            const hasStory = db
                .prepare("SELECT 1 FROM stories WHERE id = ? AND sprint_id = ?")
                .get(filter.storyId, sprint.id);
            if (!hasStory) {
                continue;
            }
        }

        entries.push({
            sprintId: sprint.id,
            sprintName: sprint.name,
            startDate: sprint.start_date,
            endDate: sprint.end_date,
            repos,
            tags,
        });
    }

    return entries;
}
