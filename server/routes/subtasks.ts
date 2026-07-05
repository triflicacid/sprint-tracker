import { Router, Request, Response } from "express";
import { getSubtaskById, updateSubtask, SubtaskUpdateError } from "../services/subtaskService.js";
import { getHistoryForEntity } from "../services/statusHistoryService.js";

export const subtasksRouter: Router = Router();

subtasksRouter.get("/:id", (req: Request, res: Response) => {
    const subtaskId = Number(req.params.id);
    const subtask = getSubtaskById(subtaskId);
    if (!subtask) {
        res.status(404).json({ error: "subtask not found" });
        return;
    }
    res.json(subtask);
});

subtasksRouter.get("/:id/history", (req: Request, res: Response) => {
    const subtaskId = Number(req.params.id);
    res.json(getHistoryForEntity("subtask", subtaskId));
});

subtasksRouter.patch("/:id", (req: Request, res: Response) => {
    const subtaskId = Number(req.params.id);
    try {
        const updated = updateSubtask(subtaskId, req.body);
        res.json(updated);
    } catch (error) {
        if (error instanceof SubtaskUpdateError) {
            res.status(400).json({ error: error.message });
            return;
        }
        throw error;
    }
});
