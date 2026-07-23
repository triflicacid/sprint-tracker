import { db } from "../db/connection.js";
import { computeStoryStatus } from "./storyService.js";
import { getDistinctProjects } from "./sprintService.js";
import { getTagsForEntity } from "./tagService.js";
import type {
    SearchEntityType,
    SearchParams,
    SearchResults,
    SearchResultSprint,
    SearchResultStory,
    SearchResultSubtask,
    StoryStatus,
    SubtaskStatus,
} from "../../shared/types.js";

const SEARCH_RESULT_LIMIT = 50;

const ALL_ENTITY_TYPES: SearchEntityType[] = ["sprint", "story", "subtask"];
const ALLOWED_ENTITY_TYPES = new Set<SearchEntityType>(ALL_ENTITY_TYPES);

export class SearchValidationError extends Error {}

interface SprintRow {
    id: number;
    name: string;
    start_date: string;
    end_date: string | null;
    comment: string | null;
    project: string | null;
}

interface StoryRow {
    id: number;
    sprint_id: number;
    sprint_name: string;
    jira_url: string;
    jira_key: string | null;
    description: string;
    jira_title: string | null;
    jira_labels: string | null;
    awaiting_more_subtasks: number;
}

interface SubtaskRow {
    id: number;
    story_id: number;
    story_jira_key: string | null;
    title: string;
    comment: string | null;
    branch_name: string | null;
    status: SubtaskStatus;
    type: string;
    repo_name: string | null;
    complexity_rating: number | null;
    release_version: string | null;
}

interface NormalizedSearchParams {
    query: string;
    queryPattern: string | null;
    entities: Set<SearchEntityType>;
    tagIds: number[];
    project: string | null;
    storyId: number | null;
    subtaskType: string | null;
}

function escapeLikePattern(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function parseJiraLabels(raw: string | null): string[] {
    if (!raw) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
        return [];
    }
}

function ensureValidTagIds(tagIds: number[]) {
    if (tagIds.length === 0) {
        return;
    }
    const placeholders = tagIds.map(() => "?").join(", ");
    const row = db
        .prepare(`SELECT COUNT(*) AS count FROM tags WHERE id IN (${placeholders})`)
        .get(...tagIds) as { count: number };
    if (row.count !== tagIds.length) {
        throw new SearchValidationError("tagId contains unknown IDs");
    }
}

function resolveProject(project: string | undefined): string | null {
    if (project === undefined) {
        return null;
    }
    const trimmed = project.trim();
    if (!trimmed) {
        throw new SearchValidationError("project must be one non-empty project name");
    }
    const projectCatalog = getDistinctProjects();
    const canonical = projectCatalog.find((entry) => entry.toLowerCase() === trimmed.toLowerCase());
    if (!canonical) {
        throw new SearchValidationError("unknown project");
    }
    return canonical;
}

function normalizeParams(params: SearchParams): NormalizedSearchParams {
    const query = params.query?.trim() ?? "";
    if (query && query.length < 2) {
        throw new SearchValidationError("query must be at least 2 characters");
    }

    const rawTagIds = params.tagIds ?? [];
    const uniqueTagIds = [...new Set(rawTagIds)];
    if (uniqueTagIds.some((tagId) => !Number.isSafeInteger(tagId) || tagId <= 0)) {
        throw new SearchValidationError("tagId must contain positive integer IDs");
    }
    ensureValidTagIds(uniqueTagIds);

    if (!query && uniqueTagIds.length === 0) {
        throw new SearchValidationError("provide a query of at least 2 characters or a tag");
    }

    const rawEntities = params.entities ?? [];
    const entityList = rawEntities.length > 0 ? rawEntities : ALL_ENTITY_TYPES;
    const unknownEntity = entityList.find((entity) => !ALLOWED_ENTITY_TYPES.has(entity));
    if (unknownEntity) {
        throw new SearchValidationError(`invalid entity: ${unknownEntity}`);
    }

    const storyId = params.storyId ?? null;
    if (storyId !== null && (!Number.isSafeInteger(storyId) || storyId <= 0)) {
        throw new SearchValidationError("storyId must be a positive integer");
    }

    const subtaskType = params.subtaskType?.trim() || null;

    const queryPattern = query ? `%${escapeLikePattern(query.toLowerCase())}%` : null;

    return {
        query,
        queryPattern,
        entities: new Set(entityList),
        tagIds: uniqueTagIds,
        project: resolveProject(params.project),
        storyId,
        subtaskType,
    };
}

function buildStoryTagFilter(alias: string, tagIds: number[]) {
    if (tagIds.length === 0) {
        return { sql: "", params: [] as (number | string)[] };
    }
    const placeholders = tagIds.map(() => "?").join(", ");
    return {
        sql: `${alias}.id IN (
            SELECT et.entity_id
            FROM entity_tags et
            WHERE et.entity_type = 'story' AND et.tag_id IN (${placeholders})
            GROUP BY et.entity_id
            HAVING COUNT(DISTINCT et.tag_id) = ?
        )`,
        params: [...tagIds, tagIds.length],
    };
}

function buildSprintResults(params: NormalizedSearchParams): SearchResultSprint[] {
    if (!params.entities.has("sprint") || !params.queryPattern) {
        return [];
    }

    const whereParts = [
        `(LOWER(COALESCE(s.name, '')) LIKE ? ESCAPE '\\'
          OR LOWER(COALESCE(s.comment, '')) LIKE ? ESCAPE '\\'
          OR LOWER(COALESCE(s.project, '')) LIKE ? ESCAPE '\\')`,
    ];
    const queryParams: (string | number)[] = [params.queryPattern, params.queryPattern, params.queryPattern];

    if (params.project) {
        whereParts.push("LOWER(COALESCE(s.project, '')) = LOWER(?)");
        queryParams.push(params.project);
    }

    queryParams.push(SEARCH_RESULT_LIMIT);

    const rows = db
        .prepare(
            `SELECT s.id, s.name, s.start_date, s.end_date, s.comment, s.project
             FROM sprints s
             WHERE ${whereParts.join(" AND ")}
             ORDER BY s.start_date DESC, s.id DESC
             LIMIT ?`
        )
        .all(...queryParams) as SprintRow[];

    return rows.map((row) => ({
        entityType: "sprint",
        id: row.id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        comment: row.comment,
        project: row.project,
    }));
}

function getStoryStatus(storyId: number, awaitingMoreSubtasks: boolean): StoryStatus {
    const statuses = db
        .prepare("SELECT status FROM subtasks WHERE story_id = ?")
        .all(storyId)
        .map((row) => (row as { status: SubtaskStatus }).status);
    return computeStoryStatus(statuses, awaitingMoreSubtasks);
}

function buildStoryResults(params: NormalizedSearchParams): SearchResultStory[] {
    if (!params.entities.has("story")) {
        return [];
    }

    const whereParts: string[] = [];
    const queryParams: (string | number)[] = [];

    if (params.queryPattern) {
        whereParts.push(`(
            LOWER(COALESCE(st.description, '')) LIKE ? ESCAPE '\\'
            OR LOWER(COALESCE(st.jira_key, '')) LIKE ? ESCAPE '\\'
            OR LOWER(COALESCE(st.jira_title, '')) LIKE ? ESCAPE '\\'
            OR EXISTS (
                SELECT 1
                FROM json_each(CASE WHEN json_valid(st.jira_labels) THEN st.jira_labels ELSE '[]' END)
                WHERE LOWER(COALESCE(json_each.value, '')) LIKE ? ESCAPE '\\'
            )
        )`);
        queryParams.push(params.queryPattern, params.queryPattern, params.queryPattern, params.queryPattern);
    }

    const storyTagFilter = buildStoryTagFilter("st", params.tagIds);
    if (storyTagFilter.sql) {
        whereParts.push(storyTagFilter.sql);
        queryParams.push(...storyTagFilter.params);
    }

    if (params.project) {
        whereParts.push("LOWER(COALESCE(sp.project, '')) = LOWER(?)");
        queryParams.push(params.project);
    }

    queryParams.push(SEARCH_RESULT_LIMIT);

    const whereClause = whereParts.length > 0 ? whereParts.join(" AND ") : "1=1";

    const rows = db
        .prepare(
            `SELECT
                st.id,
                st.sprint_id,
                sp.name AS sprint_name,
                st.jira_url,
                st.jira_key,
                st.description,
                st.jira_title,
                st.jira_labels,
                st.awaiting_more_subtasks
             FROM stories st
             JOIN sprints sp ON sp.id = st.sprint_id
             WHERE ${whereClause}
             ORDER BY sp.start_date DESC, st.id DESC
             LIMIT ?`
        )
        .all(...queryParams) as StoryRow[];

    return rows.map((row) => ({
        entityType: "story",
        id: row.id,
        sprintId: row.sprint_id,
        sprintName: row.sprint_name,
        jiraKey: row.jira_key,
        jiraUrl: row.jira_url,
        description: row.description,
        jiraTitle: row.jira_title,
        jiraLabels: parseJiraLabels(row.jira_labels),
        status: getStoryStatus(row.id, !!row.awaiting_more_subtasks),
        tags: getTagsForEntity("story", row.id),
    }));
}

function buildSubtaskResults(params: NormalizedSearchParams): SearchResultSubtask[] {
    if (!params.entities.has("subtask")) {
        return [];
    }

    const whereParts: string[] = [];
    const queryParams: (string | number)[] = [];

    if (params.queryPattern) {
        whereParts.push(`(
            LOWER(COALESCE(sub.title, '')) LIKE ? ESCAPE '\\'
            OR LOWER(COALESCE(sub.comment, '')) LIKE ? ESCAPE '\\'
            OR LOWER(COALESCE(sub.branch_name, '')) LIKE ? ESCAPE '\\'
            OR LOWER(COALESCE(sub.repo_name, '')) LIKE ? ESCAPE '\\'
            OR LOWER(COALESCE(sub.release_version, '')) LIKE ? ESCAPE '\\'
        )`);
        queryParams.push(params.queryPattern, params.queryPattern, params.queryPattern, params.queryPattern, params.queryPattern);
    }

    const storyTagFilter = buildStoryTagFilter("st", params.tagIds);
    if (storyTagFilter.sql) {
        whereParts.push(storyTagFilter.sql);
        queryParams.push(...storyTagFilter.params);
    }

    if (params.storyId !== null) {
        whereParts.push("sub.story_id = ?");
        queryParams.push(params.storyId);
    }

    if (params.subtaskType) {
        whereParts.push("sub.type = ?");
        queryParams.push(params.subtaskType);
    }

    if (params.project) {
        whereParts.push("LOWER(COALESCE(sp.project, '')) = LOWER(?)");
        queryParams.push(params.project);
    }

    queryParams.push(SEARCH_RESULT_LIMIT);

    const whereClause = whereParts.length > 0 ? whereParts.join(" AND ") : "1=1";

    const rows = db
        .prepare(
            `SELECT
                sub.id,
                sub.story_id,
                st.jira_key AS story_jira_key,
                sub.title,
                sub.comment,
                sub.branch_name,
                sub.status,
                sub.type,
                sub.repo_name,
                sub.complexity_rating,
                sub.release_version
             FROM subtasks sub
             JOIN stories st ON st.id = sub.story_id
             JOIN sprints sp ON sp.id = st.sprint_id
             WHERE ${whereClause}
             ORDER BY sp.start_date DESC, sub.id DESC
             LIMIT ?`
        )
        .all(...queryParams) as SubtaskRow[];

    return rows.map((row) => ({
        entityType: "subtask",
        id: row.id,
        storyId: row.story_id,
        storyJiraKey: row.story_jira_key,
        title: row.title,
        comment: row.comment,
        branchName: row.branch_name,
        status: row.status,
        type: row.type,
        repoName: row.repo_name,
        complexityRating: row.complexity_rating,
        releaseVersion: row.release_version,
    }));
}

/**
 * searches across sprints, stories, and subtasks.
 *
 * results are ordered by newest sprint start date, then descending entity id.
 */
export function search(params: SearchParams): SearchResults {
    const normalized = normalizeParams(params);
    return {
        sprints: buildSprintResults(normalized),
        stories: buildStoryResults(normalized),
        subtasks: buildSubtaskResults(normalized),
    };
}



