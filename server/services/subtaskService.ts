import { db } from "../db/connection.js";
import type { Subtask, SubtaskStatus } from "../../shared/types.js";
import { recordStatusChange } from "./statusHistoryService.js";
import { isTransitionAllowed, getRequiredFields, locksComplexityRating } from "./statusFlowService.js";
import { extractRepoName } from "../utils/githubUrl.js";
import { tagStoryWithRepo } from "./tagService.js";
import { isSprintLocked, SprintLockedError } from "../../shared/sprintLock.js";
import { isValidSubtaskType } from "./subtaskTypeService.js";

interface SubtaskRow {
    id: number;
    story_id: number;
    title: string;
    comment: string | null;
    branch_name: string;
    status: SubtaskStatus;
    url: string | null;
    repo_name: string | null;
    complexity_rating: number | null;
    release_version: string | null;
    type: string;
    created_at: string;
}

interface CreateSubtaskInput {
    title: string;
    type?: string;
}

interface UpdateSubtaskInput {
    title?: string;
    comment?: string | null;
    branchName?: string;
    status?: SubtaskStatus;
    prUrl?: string;
    releaseVersion?: string;
    complexityRating?: number | null;
}

export class SubtaskUpdateError extends Error {}

/**
 * gets the end date of a story's parent sprint.
 *
 * @param storyId - story to query.
 * @returns sprint end date, or `undefined` when the story is missing.
 */
function getSprintEndDateForStory(storyId: number): string | null | undefined {
    const row = db
        .prepare(
            `SELECT sprints.end_date AS end_date
             FROM stories
             JOIN sprints ON sprints.id = stories.sprint_id
             WHERE stories.id = ?`
        )
        .get(storyId) as { end_date: string | null } | undefined;
    return row?.end_date;
}

/**
 * throws when the parent sprint is locked.
 *
 * @param storyId - story to validate.
 */
function assertStorySprintUnlocked(storyId: number): void {
    const endDate = getSprintEndDateForStory(storyId);
    if (endDate !== undefined && isSprintLocked({ endDate })) {
        throw new SprintLockedError("cannot modify a subtask in a sprint that has ended");
    }
}

/**
 * maps a subtask row to a subtask payload.
 *
 * @param row - database subtask row.
 * @returns mapped subtask.
 */
function rowToSubtask(row: SubtaskRow): Subtask {
    return {
        id: row.id,
        storyId: row.story_id,
        title: row.title,
        comment: row.comment,
        branchName: row.branch_name,
        status: row.status,
        url: row.url,
        repoName: row.repo_name,
        complexityRating: row.complexity_rating,
        releaseVersion: row.release_version,
        type: row.type,
        createdAt: row.created_at,
    };
}

/**
 * gets subtasks for a story.
 *
 * @param storyId - story to query.
 * @returns subtasks for the story in creation order.
 */
export function getSubtasksForStory(storyId: number): Subtask[] {
    const rows: SubtaskRow[] = db
        .prepare("SELECT * FROM subtasks WHERE story_id = ? ORDER BY id")
        .all(storyId) as SubtaskRow[];
    return rows.map(rowToSubtask);
}

/**
 * gets one subtask by id.
 *
 * @param id - subtask to load.
 * @returns the subtask or `undefined` when it is missing.
 */
export function getSubtaskById(id: number): Subtask | undefined {
    const row: SubtaskRow | undefined = db.prepare("SELECT * FROM subtasks WHERE id = ?").get(id) as
        | SubtaskRow
        | undefined;
    return row ? rowToSubtask(row) : undefined;
}

/**
 * creates a subtask.
 *
 * @param storyId - parent story id.
 * @param input - subtask fields to persist.
 * @returns the created subtask.
 */
export function createSubtask(storyId: number, input: CreateSubtaskInput): Subtask {
    assertStorySprintUnlocked(storyId);
    if (input.type !== undefined && !isValidSubtaskType(input.type)) {
        throw new SubtaskUpdateError(`invalid subtask type: ${input.type}`);
    }
    const type = input.type ?? "unknown";
    const result = db
        .prepare("INSERT INTO subtasks (story_id, title, status, type) VALUES (?, ?, 'NEW', ?)")
        .run(storyId, input.title, type);
    const id = Number(result.lastInsertRowid);
    recordStatusChange("subtask", id, "NEW", null);
    const created: SubtaskRow = db.prepare("SELECT * FROM subtasks WHERE id = ?").get(id) as SubtaskRow;
    return rowToSubtask(created);
}

/**
 * updates a subtask.
 *
 * @param subtaskId - subtask to update.
 * @param input - partial subtask fields to apply.
 * @returns the updated subtask.
 */
export function updateSubtask(subtaskId: number, input: UpdateSubtaskInput): Subtask {
    const existing: SubtaskRow | undefined = db
        .prepare("SELECT * FROM subtasks WHERE id = ?")
        .get(subtaskId) as SubtaskRow | undefined;
    if (!existing) {
        throw new SubtaskUpdateError("subtask not found");
    }
    assertStorySprintUnlocked(existing.story_id);

    const nextStatus: SubtaskStatus = input.status ?? existing.status;
    const statusChanging: boolean = input.status !== undefined && input.status !== existing.status;

    if (statusChanging) {
        if (!isTransitionAllowed(existing.status, nextStatus)) {
            throw new SubtaskUpdateError(`cannot move from ${existing.status} to ${nextStatus}`);
        }
        for (const field of getRequiredFields(existing.status, nextStatus)) {
            const value = (input as Record<string, unknown>)[field.field];
            if (value === undefined || value === null || value === "") {
                throw new SubtaskUpdateError(`${field.label} is required for this transition`);
            }
        }
    }

    const complexityChanging = input.complexityRating !== undefined && input.complexityRating !== existing.complexity_rating;
    if (complexityChanging && locksComplexityRating(nextStatus)) {
        throw new SubtaskUpdateError("cannot change complexity once a subtask has passed cut release");
    }

    const repoName: string | null = input.prUrl ? extractRepoName(input.prUrl) : existing.repo_name;

    db.prepare(
        `UPDATE subtasks
         SET title = ?, comment = ?, branch_name = ?, status = ?, url = ?, repo_name = ?,
             complexity_rating = ?, release_version = ?
         WHERE id = ?`
    ).run(
        input.title ?? existing.title,
        input.comment === undefined ? existing.comment : input.comment,
        input.branchName ?? existing.branch_name,
        nextStatus,
        input.prUrl ?? existing.url,
        repoName,
        input.complexityRating === undefined ? existing.complexity_rating : input.complexityRating,
        input.releaseVersion ?? existing.release_version,
        subtaskId
    );

    if (statusChanging) {
        if (input.prUrl && repoName) {
            tagStoryWithRepo(existing.story_id, repoName);
        }
        recordStatusChange("subtask", subtaskId, nextStatus, input.releaseVersion ?? null);
    }

    const updated: SubtaskRow = db.prepare("SELECT * FROM subtasks WHERE id = ?").get(subtaskId) as SubtaskRow;
    return rowToSubtask(updated);
}
