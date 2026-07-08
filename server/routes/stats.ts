import { Router, Request, Response } from "express";
import {
    getSprintStats,
    getStatusBreakdown,
    getDayActivity,
    getComplexityTiming,
    getVelocityHistory,
} from "../services/statsService.js";
import type { VelocitySelection } from "../../shared/types.js";

export const statsRouter: Router = Router();

const DEFAULT_LAST_N = 5;

statsRouter.get("/sprint/:id", (req: Request, res: Response) => {
    const sprintId = Number(req.params.id);
    res.json(getSprintStats(sprintId));
});

statsRouter.get("/complexity-timing/:id", (req: Request, res: Response) => {
    const sprintId = Number(req.params.id);
    res.json(getComplexityTiming(sprintId));
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

statsRouter.get("/velocity/:id", (req: Request, res: Response) => {
    const sprintId = Number(req.params.id);
    const mode = req.query.mode === "range" || req.query.mode === "lastN" ? req.query.mode : "all";

    let selection: VelocitySelection;
    if (mode === "range") {
        selection = { mode: "range", from: String(req.query.from ?? ""), to: String(req.query.to ?? "") };
    } else if (mode === "lastN") {
        const n = Number(req.query.n);
        selection = { mode: "lastN", n: Number.isFinite(n) && n > 0 ? n : DEFAULT_LAST_N };
    } else {
        selection = { mode: "all" };
    }

    res.json(getVelocityHistory(sprintId, selection));
});
