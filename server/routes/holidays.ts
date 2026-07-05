import { Router, Request, Response } from "express";
import { listHolidaysInRange, addHoliday, removeHoliday } from "../services/holidayService.js";

export const holidaysRouter: Router = Router();

holidaysRouter.get("/", (req: Request, res: Response) => {
    const start = typeof req.query.start === "string" ? req.query.start : "0000-01-01";
    const end = typeof req.query.end === "string" ? req.query.end : "9999-12-31";
    res.json(listHolidaysInRange(start, end));
});

holidaysRouter.post("/", (req: Request, res: Response) => {
    const { date } = req.body;
    if (!date) {
        res.status(400).json({ error: "date is required" });
        return;
    }
    addHoliday(date);
    res.status(201).json({ date });
});

holidaysRouter.delete("/:date", (req: Request, res: Response) => {
    removeHoliday(req.params.date);
    res.status(204).send();
});
