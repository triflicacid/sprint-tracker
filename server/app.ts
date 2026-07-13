import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { sprintsRouter } from "./routes/sprints.js";
import { storiesRouter } from "./routes/stories.js";
import { subtasksRouter } from "./routes/subtasks.js";
import { tagsRouter } from "./routes/tags.js";
import { statsRouter } from "./routes/stats.js";
import { calendarRouter } from "./routes/calendar.js";
import { jiraRouter } from "./routes/jira.js";
import { statusFlowRouter } from "./routes/statusFlow.js";
import { holidaysRouter } from "./routes/holidays.js";
import { exportRouter } from "./routes/export.js";
import { SprintLockedError } from "./services/sprintLockService.js";

export function createApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.use("/api/sprints", sprintsRouter);
    app.use("/api/stories", storiesRouter);
    app.use("/api/subtasks", subtasksRouter);
    app.use("/api/tags", tagsRouter);
    app.use("/api/stats", statsRouter);
    app.use("/api/calendar", calendarRouter);
    app.use("/api/jira", jiraRouter);
    app.use("/api/status-flow", statusFlowRouter);
    app.use("/api/holidays", holidaysRouter);
    app.use("/api/export", exportRouter);

    const clientDist = process.env.CLIENT_DIST_PATH ?? path.join(process.cwd(), "dist", "client");
    app.use(express.static(clientDist));
    app.get("/*splat", (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith("/api")) {
            next();
            return;
        }
        res.sendFile(path.join(clientDist, "index.html"), (error) => {
            if (error) {
                next();
            }
        });
    });

    // hacky way of handling errors, but oh well
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
        if (error instanceof SprintLockedError) {
            res.status(409).json({ error: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: "internal server error" });
    });

    return app;
}
