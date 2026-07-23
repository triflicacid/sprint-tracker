import { Router, Request, Response } from "express";
import * as searchService from "../services/searchService.js";
import { isValidSubtaskType } from "../services/subtaskTypeService.js";
import { getDistinctProjects } from "../services/sprintService.js";
import { getAllTags } from "../services/tagService.js";
import type { SearchEntityType, SearchParams } from "../../shared/types.js";

export const searchRouter: Router = Router();

const VALID_ENTITIES = new Set<SearchEntityType>(["sprint", "story", "subtask"]);

function parsePositiveInteger(value: string): number | null {
    if (!/^\d+$/.test(value)) {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}

function parseTagIds(query: Request["query"]): { ok: true; tagIds: number[] } | { ok: false; error: string } {
    const rawTagIds = Array.isArray(query.tagId)
        ? query.tagId
        : query.tagId !== undefined
            ? [query.tagId]
            : [];

    const parsedTagIds: number[] = [];
    for (const rawValue of rawTagIds) {
        if (typeof rawValue !== "string") {
            return { ok: false, error: "tagId must contain positive integer IDs" };
        }
        const parsed = parsePositiveInteger(rawValue);
        if (parsed === null) {
            return { ok: false, error: "tagId must contain positive integer IDs" };
        }
        parsedTagIds.push(parsed);
    }

    const uniqueTagIds = [...new Set(parsedTagIds)];
    if (uniqueTagIds.length === 0) {
        return { ok: true, tagIds: uniqueTagIds };
    }

    const knownTagIds = new Set(getAllTags().map((tag) => tag.id));
    const unknownId = uniqueTagIds.find((tagId) => !knownTagIds.has(tagId));
    if (unknownId !== undefined) {
        return { ok: false, error: "tagId contains unknown IDs" };
    }

    return { ok: true, tagIds: uniqueTagIds };
}

function parseEntities(rawEntities: unknown): { ok: true; entities: SearchEntityType[] | undefined } | { ok: false; error: string } {
    if (rawEntities === undefined) {
        return { ok: true, entities: undefined };
    }
    if (typeof rawEntities !== "string") {
        return { ok: false, error: "entities must be a comma-separated string" };
    }

    const entities = rawEntities
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    if (entities.length === 0) {
        return { ok: false, error: "entities must include at least one value" };
    }

    const deduped = [...new Set(entities)];
    const invalid = deduped.find((entity) => !VALID_ENTITIES.has(entity as SearchEntityType));
    if (invalid) {
        return { ok: false, error: `invalid entity: ${invalid}` };
    }

    return { ok: true, entities: deduped as SearchEntityType[] };
}

function parseProject(rawProject: unknown): { ok: true; project: string | undefined } | { ok: false; error: string } {
    if (rawProject === undefined) {
        return { ok: true, project: undefined };
    }
    if (typeof rawProject !== "string") {
        return { ok: false, error: "project must be one non-empty project name" };
    }

    const trimmed = rawProject.trim();
    if (!trimmed) {
        return { ok: false, error: "project must be one non-empty project name" };
    }

    const canonical = getDistinctProjects().find((project) => project.toLowerCase() === trimmed.toLowerCase());
    if (!canonical) {
        return { ok: false, error: "unknown project" };
    }

    return { ok: true, project: canonical };
}

searchRouter.get("/", (req: Request, res: Response) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (query && query.length < 2) {
        res.status(400).json({ error: "query must be at least 2 characters" });
        return;
    }

    const parsedTags = parseTagIds(req.query);
    if (!parsedTags.ok) {
        res.status(400).json({ error: parsedTags.error });
        return;
    }

    if (!query && parsedTags.tagIds.length === 0) {
        res.status(400).json({ error: "provide a query of at least 2 characters or a tag" });
        return;
    }

    const parsedEntities = parseEntities(req.query.entities);
    if (!parsedEntities.ok) {
        res.status(400).json({ error: parsedEntities.error });
        return;
    }

    let storyId: number | undefined;
    if (req.query.storyId !== undefined) {
        if (typeof req.query.storyId !== "string") {
            res.status(400).json({ error: "storyId must be a positive integer" });
            return;
        }
        const parsedStoryId = parsePositiveInteger(req.query.storyId);
        if (parsedStoryId === null) {
            res.status(400).json({ error: "storyId must be a positive integer" });
            return;
        }
        storyId = parsedStoryId;
    }

    let subtaskType: string | undefined;
    if (req.query.subtaskType !== undefined) {
        if (typeof req.query.subtaskType !== "string") {
            res.status(400).json({ error: "subtaskType must be a string" });
            return;
        }
        const trimmed = req.query.subtaskType.trim();
        if (!trimmed || !isValidSubtaskType(trimmed)) {
            res.status(400).json({ error: "invalid subtask type" });
            return;
        }
        subtaskType = trimmed;
    }

    const parsedProject = parseProject(req.query.project);
    if (!parsedProject.ok) {
        res.status(400).json({ error: parsedProject.error });
        return;
    }

    try {
        const params: SearchParams = {
            query: query || undefined,
            tagIds: parsedTags.tagIds,
            entities: parsedEntities.entities,
            storyId,
            subtaskType,
            project: parsedProject.project,
        };
        res.json(searchService.search(params));
    } catch (error) {
        if (error instanceof searchService.SearchValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }
        throw error;
    }
});

