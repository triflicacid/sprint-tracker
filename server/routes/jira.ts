import { Router, Request, Response } from "express";
import { fetchJiraInfo } from "../services/jiraService.js";
import { updateStoryJiraInfo } from "../services/storyService.js";

export const jiraRouter: Router = Router();

// fetches jira info for an issue key. if a storyId query param is given
// the result is cached on that story so it does not need refetching.
jiraRouter.get("/:key", async (req: Request, res: Response) => {
    const issueKey: string = req.params.key;
    const info = await fetchJiraInfo(issueKey);
    if (!info) {
        res.status(404).json({ error: "jira info not available, check configuration or issue key" });
        return;
    }
    const storyId: number | undefined = req.query.storyId ? Number(req.query.storyId) : undefined;
    if (storyId) {
        updateStoryJiraInfo(storyId, info.title, info.labels);
    }
    res.json(info);
});
