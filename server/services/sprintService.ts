import { db } from "../db/connection.js";
import type { SprintSummary, SprintDetail } from "../../shared/types.js";
import { getStorySummariesForSprint } from "./storyService.js";
import { isSprintLocked, SprintLockedError } from "../../shared/sprintLock.js";

interface SprintRow {
    id: number;
    name: string;
    start_date: string;
    end_date: string | null;
    comment: string | null;
    project: string | null;
}

interface CreateSprintInput {
    name: string;
    startDate: string;
    endDate?: string | null;
    comment?: string | null;
    project?: string | null;
}

/**
 * maps a sprint row to a sprint summary.
 *
 * @param row - database sprint row.
 * @returns mapped sprint summary.
 */
function rowToSummary(row: SprintRow) {
    const counts = db
        .prepare(
            `SELECT
                (SELECT COUNT(*) FROM stories WHERE sprint_id = ?) AS story_count,
                (SELECT COUNT(*) FROM subtasks
                    JOIN stories ON stories.id = subtasks.story_id
                    WHERE stories.sprint_id = ? AND subtasks.url IS NOT NULL) AS pr_count`
        )
        .get(row.id, row.id) as { story_count: number; pr_count: number };

    return {
        id: row.id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        comment: row.comment,
        project: row.project,
        storyCount: counts.story_count,
        prCount: counts.pr_count,
    } as SprintSummary;
}

/**
 * lists sprint summaries.
 *
 * @returns sprint summaries ordered by newest start date first.
 */
export function listSprintSummaries() {
    const rows = db
        .prepare("SELECT * FROM sprints ORDER BY start_date DESC")
        .all() as SprintRow[];
    return rows.map(rowToSummary) as SprintSummary[];
}

/**
 * creates a sprint.
 *
 * @param input - sprint fields to persist.
 * @returns the created sprint summary.
 */
export function createSprint(input: CreateSprintInput) {
    const previous = db
        .prepare("SELECT * FROM sprints ORDER BY id DESC LIMIT 1")
        .get() as SprintRow | undefined;

    if (previous && previous.end_date === null) {
        db.prepare("UPDATE sprints SET end_date = ? WHERE id = ?").run(
            input.startDate,
            previous.id
        );
    }

    const result = db
        .prepare(
            "INSERT INTO sprints (name, start_date, end_date, comment, project) VALUES (?, ?, ?, ?, ?)"
        )
        .run(input.name, input.startDate, input.endDate ?? null, input.comment ?? null, input.project ?? null);

    const created = db
        .prepare("SELECT * FROM sprints WHERE id = ?")
        .get(Number(result.lastInsertRowid)) as SprintRow;
    return rowToSummary(created);
}

/**
 * gets sprint detail.
 *
 * @param sprintId - sprint to load.
 * @returns sprint detail or `null` when the sprint is missing.
 */
export function getSprintDetail(sprintId: number) {
    const row = db
        .prepare("SELECT * FROM sprints WHERE id = ?")
        .get(sprintId) as SprintRow | undefined;
    if (!row) {
        return null;
    }
    const summary = rowToSummary(row);
    return {
        ...summary,
        stories: getStorySummariesForSprint(sprintId),
    } as SprintDetail;
}

/**
 * updates a sprint.
 *
 * @param sprintId - sprint to update.
 * @param input - partial sprint fields to apply.
 */
export function updateSprint(sprintId: number, input: Partial<CreateSprintInput>) {
    const existing = db
        .prepare("SELECT * FROM sprints WHERE id = ?")
        .get(sprintId) as SprintRow | undefined;
    if (!existing) {
        return;
    }
    if (isSprintLocked({ endDate: existing.end_date })) {
        throw new SprintLockedError("cannot edit a sprint that has ended");
    }
    db.prepare(
        "UPDATE sprints SET name = ?, start_date = ?, end_date = ?, comment = ?, project = ? WHERE id = ?"
    ).run(
        input.name ?? existing.name,
        input.startDate ?? existing.start_date,
        input.endDate === undefined ? existing.end_date : input.endDate,
        input.comment === undefined ? existing.comment : input.comment,
        input.project === undefined ? existing.project : input.project,
        sprintId
    );
}

/**
 * gets distinct project names from all sprints.
 *
 * @returns list of unique non-null project values ordered by most recent usage.
 */
export function getDistinctProjects() {
    const rows = db
        .prepare(
            `SELECT project, MAX(start_date) as max_start_date FROM sprints 
             WHERE project IS NOT NULL AND project != '' 
             GROUP BY project
             ORDER BY max_start_date DESC`
        )
        .all() as { project: string; max_start_date: string }[];
    return rows.map(row => row.project);
}

