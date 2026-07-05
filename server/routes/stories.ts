import { Router, Request, Response } from "express";
import { getStoryDetail, updateStoryAwaitingMoreSubtasks } from "../services/storyService.js";
import { createSubtask } from "../services/subtaskService.js";
import { findOrCreateTag, attachTag, getTagsForEntity, removeTag } from "../services/tagService.js";

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
    const { awaitingMoreSubtasks } = req.body;
    const updated = updateStoryAwaitingMoreSubtasks(storyId, !!awaitingMoreSubtasks);
    if (!updated) {
        res.status(404).json({ error: "story not found" });
        return;
    }
    res.json(updated);
});

storiesRouter.post("/:id/subtasks", (req: Request, res: Response) => {
    const storyId = Number(req.params.id);
    const { description } = req.body;
    if (!description) {
        res.status(400).json({ error: "description is required" });
        return;
    }
    res.status(201).json(createSubtask(storyId, { description }));
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
    const tag = findOrCreateTag(name, "custom");
    attachTag("story", storyId, tag.id);
    res.status(201).json(tag);
});

storiesRouter.delete("/:id/tags/:tagId", (req: Request, res: Response) => {
    const storyId = Number(req.params.id);
    const tagId = Number(req.params.tagId);
    removeTag("story", storyId, tagId);
    res.status(204).send();
});
