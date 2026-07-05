import { Router, Request, Response } from "express";
import { getAllTags } from "../services/tagService.js";

export const tagsRouter: Router = Router();

tagsRouter.get("/", (_req: Request, res: Response) => {
    res.json(getAllTags());
});
