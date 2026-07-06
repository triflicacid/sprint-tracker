import { Router, Request, Response } from "express";
import { buildMarkdownExport } from "../services/exportService.js";

export const exportRouter: Router = Router();

exportRouter.post("/markdown", (req: Request, res: Response) => {
    const { sprintIds, fields } = req.body;
    if (!Array.isArray(sprintIds) || sprintIds.length === 0) {
        res.status(400).json({ error: "sprintIds is required" });
        return;
    }
    if (!fields || typeof fields !== "object") {
        res.status(400).json({ error: "fields is required" });
        return;
    }

    const markdown = buildMarkdownExport(sprintIds, fields);
    const filename = `sprint-export-${new Date().toISOString().slice(0, 10)}.md`;
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(markdown);
});
