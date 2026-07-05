import { Router, Request, Response } from "express";
import { getSprintStats, getStatusBreakdown, getDayActivity } from "../services/statsService.js";

export const statsRouter: Router = Router();

statsRouter.get("/sprint/:id", (req: Request, res: Response) => {
    const sprintId = Number(req.params.id);
    res.json(getSprintStats(sprintId));
});

statsRouter.get("/status-breakdown/:id", (req: Request, res: Response) => {
    const sprintId = Number(req.params.id);
    const granularity = req.query.granularity === "story" ? "story" : "subtask";
    res.json(getStatusBreakdown(sprintId, granularity));
});

statsRouter.get("/day-activity/:id", (req: Request, res: Response) => {
    const sprintId = Number(req.params.id);
    res.json(getDayActivity(sprintId));
});
