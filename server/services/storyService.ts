import { db } from "../db/connection.js";
import type { StorySummary, StoryDetail, StoryStatus, SubtaskStatus, Tag, TagType } from "../../shared/types.js";
import { extractJiraKey } from "../utils/githubUrl.js";
import { attachTag, findOrCreateTag, getTagsForEntity, removeTag } from "./tagService.js";
import { getSubtasksForStory } from "./subtaskService.js";
import { rankOf } from "./statusFlowService.js";
import { isSprintLocked, SprintLockedError } from "../../shared/sprintLock.js";

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
    created_at: string;
}

interface CreateStoryInput {
    jiraUrl: string;
    description: string;
}

// - No subtasks -> JIRA_ONLY.
// - awaitingMoreSubtasks checked, or no subtask has started yet -> WORK_REMAINING.
// - Otherwise, the lowest-rank status among its subtasks (so one lagging
//   subtask holds the whole story back, all the way up to DONE).
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
        tags: getTagsForEntity("story", row.id),
        prCount,
    } as StorySummary;
}

function getSprintEndDateForStory(storyId: number) {
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

function assertSprintUnlocked(sprintId: number): void {
    const sprint = db.prepare("SELECT end_date FROM sprints WHERE id = ?").get(sprintId) as
        | { end_date: string | null }
        | undefined;
    if (sprint && isSprintLocked({ endDate: sprint.end_date })) {
        throw new SprintLockedError("cannot add a story to a sprint that has ended");
    }
}

function assertStorySprintUnlocked(storyId: number): void {
    const endDate = getSprintEndDateForStory(storyId);
    if (endDate !== undefined && isSprintLocked({ endDate })) {
        throw new SprintLockedError("cannot modify a story in a sprint that has ended");
    }
}

export function getStorySummariesForSprint(sprintId: number) {
    const rows = db
        .prepare("SELECT * FROM stories WHERE sprint_id = ? ORDER BY id")
        .all(sprintId) as StoryRow[];
    return rows.map(rowToSummary);
}

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

export function createStory(sprintId: number, input: CreateStoryInput) {
    assertSprintUnlocked(sprintId);
    const jiraKey = extractJiraKey(input.jiraUrl);
    const result = db
        .prepare(
            "INSERT INTO stories (sprint_id, jira_url, jira_key, description) VALUES (?, ?, ?, ?)"
        )
        .run(sprintId, input.jiraUrl, jiraKey, input.description);

    const created = db
        .prepare("SELECT * FROM stories WHERE id = ?")
        .get(Number(result.lastInsertRowid)) as StoryRow;
    return rowToSummary(created);
}

// stores basic jira info fetched from the jira api
export function updateStoryJiraInfo(storyId: number, title: string, labels: string[]) {
    db.prepare("UPDATE stories SET jira_title = ?, jira_labels = ? WHERE id = ?").run(
        title,
        JSON.stringify(labels),
        storyId
    );
}

export function updateStoryAwaitingMoreSubtasks(storyId: number, awaitingMoreSubtasks: boolean) {
    assertStorySprintUnlocked(storyId);
    db.prepare("UPDATE stories SET awaiting_more_subtasks = ? WHERE id = ?").run(awaitingMoreSubtasks ? 1 : 0, storyId);
    const row = db
        .prepare("SELECT * FROM stories WHERE id = ?")
        .get(storyId) as StoryRow | undefined;
    return row ? rowToSummary(row) : null;
}

export function updateStoryPoints(storyId: number, storyPoints: number | null) {
    assertStorySprintUnlocked(storyId);
    db.prepare("UPDATE stories SET story_points = ? WHERE id = ?").run(storyPoints, storyId);
    const row = db
        .prepare("SELECT * FROM stories WHERE id = ?")
        .get(storyId) as StoryRow | undefined;
    return row ? rowToSummary(row) : null;
}

export function addTagToStory(storyId: number, name: string, tagType: TagType): Tag {
    assertStorySprintUnlocked(storyId);
    const tag = findOrCreateTag(name, tagType);
    attachTag("story", storyId, tag.id);
    return tag;
}

export function removeTagFromStory(storyId: number, tagId: number): void {
    assertStorySprintUnlocked(storyId);
    removeTag("story", storyId, tagId);
}
