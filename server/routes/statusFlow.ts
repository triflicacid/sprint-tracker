import { Router, Request, Response } from "express";
import { getStatusFlow } from "../services/statusFlowService.js";

export const statusFlowRouter: Router = Router();

statusFlowRouter.get("/", (req: Request, res: Response) => {
    res.json(getStatusFlow());
});
