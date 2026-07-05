import { Router, Request, Response } from "express";
import { getCalendarEntries } from "../services/statsService.js";

export const calendarRouter: Router = Router();

calendarRouter.get("/", (req: Request, res: Response) => {
    const repo = typeof req.query.repo === "string" ? req.query.repo : undefined;
    const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
    const storyId = req.query.storyId ? Number(req.query.storyId) : undefined;
    res.json(getCalendarEntries({ repo, tag, storyId }));
});
