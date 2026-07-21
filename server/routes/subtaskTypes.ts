import { Router, Request, Response } from "express";
import { getSubtaskTypes } from "../services/subtaskTypeService.js";

export const subtaskTypesRouter: Router = Router();

subtaskTypesRouter.get("/", (_req: Request, res: Response) => {
    res.json(getSubtaskTypes());
});

