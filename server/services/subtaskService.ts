import { db } from "../db/connection.js";
import type { Subtask, SubtaskStatus } from "../../shared/types.js";
import { recordStatusChange } from "./statusHistoryService.js";
import { isTransitionAllowed, getRequiredFields } from "./statusFlowService.js";
import { extractRepoName } from "../utils/githubUrl.js";
import { tagStoryWithRepo } from "./tagService.js";

interface SubtaskRow {
    id: number;
    story_id: number;
    description: string;
    branch_name: string;
    status: SubtaskStatus;
    url: string | null;
    repo_name: string | null;
    complexity_rating: number | null;
    release_version: string | null;
    created_at: string;
}

interface CreateSubtaskInput {
    description: string;
}

interface UpdateSubtaskInput {
    description?: string;
    branchName?: string;
    status?: SubtaskStatus;
    prUrl?: string;
    releaseVersion?: string;
    complexityRating?: number | null;
}

export class SubtaskUpdateError extends Error {}

function rowToSubtask(row: SubtaskRow): Subtask {
    return {
        id: row.id,
        storyId: row.story_id,
        description: row.description,
        branchName: row.branch_name,
        status: row.status,
        url: row.url,
        repoName: row.repo_name,
        complexityRating: row.complexity_rating,
        releaseVersion: row.release_version,
        createdAt: row.created_at,
    };
}

export function getSubtasksForStory(storyId: number): Subtask[] {
    const rows: SubtaskRow[] = db
        .prepare("SELECT * FROM subtasks WHERE story_id = ? ORDER BY id ASC")
        .all(storyId) as SubtaskRow[];
    return rows.map(rowToSubtask);
}

export function getSubtaskById(id: number): Subtask | undefined {
    const row: SubtaskRow | undefined = db.prepare("SELECT * FROM subtasks WHERE id = ?").get(id) as
        | SubtaskRow
        | undefined;
    return row ? rowToSubtask(row) : undefined;
}

export function createSubtask(storyId: number, input: CreateSubtaskInput): Subtask {
    const result = db
        .prepare("INSERT INTO subtasks (story_id, description, status) VALUES (?, ?, 'NEW')")
        .run(storyId, input.description);
    const id: number = Number(result.lastInsertRowid);
    recordStatusChange("subtask", id, "NEW", null);
    const created: SubtaskRow = db.prepare("SELECT * FROM subtasks WHERE id = ?").get(id) as SubtaskRow;
    return rowToSubtask(created);
}

// Plain field updates need no validation. A status change is checked
// against static/statusFlow.json: destination must be an allowed next
// state, and any field that transition requires must be present.
export function updateSubtask(subtaskId: number, input: UpdateSubtaskInput): Subtask {
    const existing: SubtaskRow | undefined = db
        .prepare("SELECT * FROM subtasks WHERE id = ?")
        .get(subtaskId) as SubtaskRow | undefined;
    if (!existing) {
        throw new SubtaskUpdateError("subtask not found");
    }

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

    const repoName: string | null = input.prUrl ? extractRepoName(input.prUrl) : existing.repo_name;

    db.prepare(
        `UPDATE subtasks
         SET description = ?, branch_name = ?, status = ?, url = ?, repo_name = ?,
             complexity_rating = ?, release_version = ?
         WHERE id = ?`
    ).run(
        input.description ?? existing.description,
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
