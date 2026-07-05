import { db } from "../db/connection.js";
import type { SprintSummary, SprintDetail } from "../../shared/types.js";
import { getStorySummariesForSprint } from "./storyService.js";

interface SprintRow {
    id: number;
    name: string;
    start_date: string;
    end_date: string | null;
    comment: string | null;
}

interface CreateSprintInput {
    name: string;
    startDate: string;
    endDate?: string | null;
    comment?: string | null;
}

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
        storyCount: counts.story_count,
        prCount: counts.pr_count,
    } as SprintSummary;
}

// lists sprint summaries, newest first
export function listSprintSummaries() {
    const rows = db
        .prepare("SELECT * FROM sprints ORDER BY start_date DESC")
        .all() as SprintRow[];
    return rows.map(rowToSummary) as SprintSummary[];
}

// creates a new sprint. if the most recently created sprint has no end
// date, it is automatically filled in with this sprint's start date.
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
            "INSERT INTO sprints (name, start_date, end_date, comment) VALUES (?, ?, ?, ?)"
        )
        .run(input.name, input.startDate, input.endDate ?? null, input.comment ?? null);

    const created = db
        .prepare("SELECT * FROM sprints WHERE id = ?")
        .get(Number(result.lastInsertRowid)) as SprintRow;
    return rowToSummary(created);
}

// fetches a single sprint along with story summaries.
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

export function updateSprint(sprintId: number, input: Partial<CreateSprintInput>) {
    const existing = db
        .prepare("SELECT * FROM sprints WHERE id = ?")
        .get(sprintId) as SprintRow | undefined;
    if (!existing) {
        return;
    }
    db.prepare(
        "UPDATE sprints SET name = ?, start_date = ?, end_date = ?, comment = ? WHERE id = ?"
    ).run(
        input.name ?? existing.name,
        input.startDate ?? existing.start_date,
        input.endDate === undefined ? existing.end_date : input.endDate,
        input.comment === undefined ? existing.comment : input.comment,
        sprintId
    );
}
