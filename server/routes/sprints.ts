import { Router, Request, Response } from "express";
import { listSprintSummaries, createSprint, getSprintDetail, updateSprint } from "../services/sprintService.js";
import { createStory } from "../services/storyService.js";

export const sprintsRouter: Router = Router();

sprintsRouter.get("/", (_req: Request, res: Response) => {
    res.json(listSprintSummaries());
});

sprintsRouter.post("/", (req: Request, res: Response) => {
    const { name, startDate, endDate, comment } = req.body;
    if (!name || !startDate) {
        res.status(400).json({ error: "name and startDate are required" });
        return;
    }
    res.status(201).json(createSprint({ name, startDate, endDate, comment }));
});

sprintsRouter.get("/:id", (req: Request, res: Response) => {
    const sprintId = Number(req.params.id);
    const sprint = getSprintDetail(sprintId);
    if (!sprint) {
        res.status(404).json({ error: "sprint not found" });
        return;
    }
    res.json(sprint);
});

sprintsRouter.patch("/:id", (req: Request, res: Response) => {
    const sprintId = Number(req.params.id);
    updateSprint(sprintId, req.body);
    const sprint = getSprintDetail(sprintId);
    res.json(sprint);
});

// creating a story is nested under its parent sprint.
sprintsRouter.post("/:id/stories", (req: Request, res: Response) => {
    const sprintId = Number(req.params.id);
    const { jiraUrl, description, isBug } = req.body;
    if (!jiraUrl || !description) {
        res.status(400).json({ error: "jiraUrl and description are required" });
        return;
    }
    res.status(201).json(createStory(sprintId, { jiraUrl, description, isBug: !!isBug }));
});
