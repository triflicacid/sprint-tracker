import { Router, Request, Response } from "express";
import {
    addTagToStory,
    getStoryDetail,
    removeTagFromStory,
    updateStoryAwaitingMoreSubtasks,
    updateStoryPoints,
} from "../services/storyService.js";
import type { StorySummary } from "../../shared/types.js";
import { createSubtask, SubtaskUpdateError } from "../services/subtaskService.js";
import { getTagsForEntity } from "../services/tagService.js";

export const storiesRouter: Router = Router();

storiesRouter.get("/:id", (req: Request, res: Response) => {
    const storyId = Number(req.params.id);
    const story = getStoryDetail(storyId);
    if (!story) {
        res.status(404).json({ error: "story not found" });
        return;
    }
    res.json(story);
});

storiesRouter.patch("/:id", (req: Request, res: Response) => {
    const storyId = Number(req.params.id);
    const { awaitingMoreSubtasks, storyPoints } = req.body;
    let updated: StorySummary | null = null;
    if (awaitingMoreSubtasks !== undefined) {
        updated = updateStoryAwaitingMoreSubtasks(storyId, !!awaitingMoreSubtasks);
    }
    if (storyPoints !== undefined) {
        updated = updateStoryPoints(storyId, storyPoints);
    }
    if (!updated) {
        updated = getStoryDetail(storyId);
    }
    if (!updated) {
        res.status(404).json({ error: "story not found" });
        return;
    }
    res.json(updated);
});

storiesRouter.post("/:id/subtasks", (req: Request, res: Response) => {
    const storyId = Number(req.params.id);
    const { title, type } = req.body;
    if (!title) {
        res.status(400).json({ error: "title is required" });
        return;
    }
    try {
        res.status(201).json(createSubtask(storyId, { title, type }));
    } catch (error) {
        if (error instanceof SubtaskUpdateError) {
            res.status(400).json({ error: (error as Error).message });
            return;
        }
        throw error;
    }
});

storiesRouter.get("/:id/tags", (req: Request, res: Response) => {
    const storyId = Number(req.params.id);
    res.json(getTagsForEntity("story", storyId));
});

storiesRouter.post("/:id/tags", (req: Request, res: Response) => {
    const storyId = Number(req.params.id);
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ error: "name is required" });
        return;
    }
    const tag = addTagToStory(storyId, name, "custom");
    res.status(201).json(tag);
});

storiesRouter.delete("/:id/tags/:tagId", (req: Request, res: Response) => {
    const storyId = Number(req.params.id);
    const tagId = Number(req.params.tagId);
    removeTagFromStory(storyId, tagId);
    res.status(204).send();
});
