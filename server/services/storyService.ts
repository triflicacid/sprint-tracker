import { db } from "../db/connection.js";
import type { StorySummary, StoryDetail, StoryStatus, SubtaskStatus, Tag, TagType } from "../../shared/types.js";
import { extractJiraKey } from "../utils/githubUrl.js";
import { attachTag, findOrCreateTag, getTagsForEntity, removeTag } from "./tagService.js";
import { getSubtasksForStory } from "./subtaskService.js";
import { rankOf } from "./statusFlowService.js";
import { isSprintLocked, SprintLockedError, ManualLockError } from "../../shared/sprintLock.js";

interface StoryRow {
    id: number;
    sprint_id: number;
    jira_url: string;
    jira_key: string | null;
    description: string;
    jira_title: string | null;
    jira_labels: string | null;
    awaiting_more_subtasks: number;
    story_points: number | null;
    is_bug: number;
    locked: number;
    created_at: string;
}

interface CreateStoryInput {
    jiraUrl: string;
    description: string;
    isBug?: boolean;
}

/**
 * computes the aggregate status for a story.
 *
 * @param subtaskStatuses - statuses of the story's subtasks.
 * @param awaitingMoreSubtasks - whether more subtasks are still expected.
 * @returns the derived story status.
 */
export function computeStoryStatus(subtaskStatuses: SubtaskStatus[], awaitingMoreSubtasks: boolean): StoryStatus {
    if (subtaskStatuses.length === 0) {
        return "JIRA_ONLY";
    }
    const allNew = subtaskStatuses.every((status) => status === "NEW");
    if (awaitingMoreSubtasks || allNew) {
        return "WORK_REMAINING";
    }
    return subtaskStatuses.reduce((lowest, status) => (rankOf(status) < rankOf(lowest) ? status : lowest));
}

/**
 * maps a story row to a story summary.
 *
 * @param row - database story row.
 * @returns mapped story summary.
 */
function rowToSummary(row: StoryRow) {
    const subtaskStatuses = db
        .prepare("SELECT status FROM subtasks WHERE story_id = ?")
        .all(row.id)
        .map((r) => (r as { status: SubtaskStatus }).status);

    const prCount = (
        db
            .prepare("SELECT COUNT(*) AS count FROM subtasks WHERE story_id = ? AND url IS NOT NULL")
            .get(row.id) as { count: number }
    ).count;

    return {
        id: row.id,
        sprintId: row.sprint_id,
        jiraUrl: row.jira_url,
        jiraKey: row.jira_key,
        description: row.description,
        jiraTitle: row.jira_title,
        jiraLabels: row.jira_labels ? JSON.parse(row.jira_labels) : [],
        status: computeStoryStatus(subtaskStatuses, !!row.awaiting_more_subtasks),
        awaitingMoreSubtasks: !!row.awaiting_more_subtasks,
        storyPoints: row.story_points,
        isBug: !!row.is_bug,
        locked: !!row.locked,
        tags: getTagsForEntity("story", row.id),
        prCount,
    } as StorySummary;
}

/**
 * throws when a sprint is locked.
 *
 * @param sprintId - sprint to validate.
 */
function assertSprintUnlocked(sprintId: number): void {
    const sprint = db.prepare("SELECT end_date FROM sprints WHERE id = ?").get(sprintId) as
        | { end_date: string | null }
        | undefined;
    if (sprint && isSprintLocked({ endDate: sprint.end_date })) {
        throw new SprintLockedError("cannot add a story to a sprint that has ended");
    }
}

/**
 * gets a story's sprint end date and its own manual lock flag.
 *
 * @param storyId - story to query.
 * @returns lock state, or `undefined` when the story is missing.
 */
function getStoryLockState(storyId: number): { endDate: string | null; locked: boolean } | undefined {
    const row = db
        .prepare(
            `SELECT sprints.end_date AS end_date, stories.locked AS locked
             FROM stories
             JOIN sprints ON sprints.id = stories.sprint_id
             WHERE stories.id = ?`
        )
        .get(storyId) as { end_date: string | null; locked: number } | undefined;
    return row ? { endDate: row.end_date, locked: !!row.locked } : undefined;
}

/**
 * throws when the story's sprint has ended or the story is manually locked.
 *
 * @param storyId - story to validate.
 */
function assertStoryMutable(storyId: number): void {
    const state = getStoryLockState(storyId);
    if (!state) {
        return;
    }
    if (isSprintLocked({ endDate: state.endDate })) {
        throw new SprintLockedError("cannot modify a story in a sprint that has ended");
    }
    if (state.locked) {
        throw new ManualLockError("cannot modify a manually locked story");
    }
}

/**
 * gets story summaries for a sprint.
 *
 * @param sprintId - sprint to query.
 * @returns story summaries for the sprint.
 */
export function getStorySummariesForSprint(sprintId: number) {
    const rows = db
        .prepare("SELECT * FROM stories WHERE sprint_id = ? ORDER BY id")
        .all(sprintId) as StoryRow[];
    return rows.map(rowToSummary);
}

/**
 * gets story detail.
 *
 * @param storyId - story to load.
 * @returns story detail or `null` when the story is missing.
 */
export function getStoryDetail(storyId: number) {
    const row = db
        .prepare("SELECT * FROM stories WHERE id = ?")
        .get(storyId) as StoryRow | undefined;
    if (!row) {
        return null;
    }
    const summary = rowToSummary(row);
    const sprint = db.prepare("SELECT end_date FROM sprints WHERE id = ?").get(row.sprint_id) as
        | { end_date: string | null }
        | undefined;
    return {
        ...summary,
        sprintEndDate: sprint?.end_date ?? null,
        subtasks: getSubtasksForStory(storyId),
    } as StoryDetail;
}

/**
 * creates a story.
 *
 * @param sprintId - parent sprint id.
 * @param input - story fields to persist.
 * @returns the created story summary.
 */
export function createStory(sprintId: number, input: CreateStoryInput) {
    assertSprintUnlocked(sprintId);
    const jiraKey = extractJiraKey(input.jiraUrl);
    const result = db
        .prepare(
            "INSERT INTO stories (sprint_id, jira_url, jira_key, description, is_bug) VALUES (?, ?, ?, ?, ?)"
        )
        .run(sprintId, input.jiraUrl, jiraKey, input.description, input.isBug ? 1 : 0);

    const created = db
        .prepare("SELECT * FROM stories WHERE id = ?")
        .get(Number(result.lastInsertRowid)) as StoryRow;
    return rowToSummary(created);
}

/**
 * stores jira info on a story.
 *
 * @param storyId - story to update.
 * @param title - jira title to store.
 * @param labels - jira labels to store.
 */
export function updateStoryJiraInfo(storyId: number, title: string, labels: string[]) {
    db.prepare("UPDATE stories SET jira_title = ?, jira_labels = ? WHERE id = ?").run(
        title,
        JSON.stringify(labels),
        storyId
    );
}

/**
 * updates the awaiting-more-subtasks flag.
 *
 * @param storyId - story to update.
 * @param awaitingMoreSubtasks - new flag value.
 * @returns the updated story summary or `null` when the story is missing.
 */
export function updateStoryAwaitingMoreSubtasks(storyId: number, awaitingMoreSubtasks: boolean) {
    assertStoryMutable(storyId);
    db.prepare("UPDATE stories SET awaiting_more_subtasks = ? WHERE id = ?").run(awaitingMoreSubtasks ? 1 : 0, storyId);
    const row = db
        .prepare("SELECT * FROM stories WHERE id = ?")
        .get(storyId) as StoryRow | undefined;
    return row ? rowToSummary(row) : null;
}

/**
 * updates story points.
 *
 * @param storyId - story to update.
 * @param storyPoints - new story points value.
 * @returns the updated story summary or `null` when the story is missing.
 */
export function updateStoryPoints(storyId: number, storyPoints: number | null) {
    assertStoryMutable(storyId);
    db.prepare("UPDATE stories SET story_points = ? WHERE id = ?").run(storyPoints, storyId);
    const row = db
        .prepare("SELECT * FROM stories WHERE id = ?")
        .get(storyId) as StoryRow | undefined;
    return row ? rowToSummary(row) : null;
}

/**
 * adds a tag to a story.
 *
 * @param storyId - story to tag.
 * @param name - tag name.
 * @param tagType - tag type.
 * @returns the attached tag.
 */
export function addTagToStory(storyId: number, name: string, tagType: TagType): Tag {
    assertStoryMutable(storyId);
    const tag = findOrCreateTag(name, tagType);
    attachTag("story", storyId, tag.id);
    return tag;
}

/**
 * removes a tag from a story.
 *
 * @param storyId - story to update.
 * @param tagId - tag to detach.
 */
export function removeTagFromStory(storyId: number, tagId: number): void {
    assertStoryMutable(storyId);
    removeTag("story", storyId, tagId);
}

/**
 * sets a story's manual lock flag.
 *
 * locking on is rejected once the sprint has ended; unlocking is always allowed, though it has no
 * visible effect once the sprint-end lock already applies.
 *
 * @param storyId - story to update.
 * @param locked - new manual lock value.
 * @returns the updated story summary or `null` when the story is missing.
 */
export function setStoryLocked(storyId: number, locked: boolean) {
    const state = getStoryLockState(storyId);
    if (!state) {
        return null;
    }
    if (locked && isSprintLocked({ endDate: state.endDate })) {
        throw new SprintLockedError("cannot lock a story in a sprint that has ended");
    }
    db.prepare("UPDATE stories SET locked = ? WHERE id = ?").run(locked ? 1 : 0, storyId);
    const row = db
        .prepare("SELECT * FROM stories WHERE id = ?")
        .get(storyId) as StoryRow | undefined;
    return row ? rowToSummary(row) : null;
}
