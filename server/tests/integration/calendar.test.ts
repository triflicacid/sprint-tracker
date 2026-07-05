import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();

describe("GET /api/calendar", () => {
    it("lists sprints with their touched repos", async () => {
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const story = await request(app)
            .post(`/api/sprints/${sprint.body.id}/stories`)
            .send({ jiraUrl: "https://x/browse/NEB-1", description: "story" });
        const subtask = await request(app).post(`/api/stories/${story.body.id}/subtasks`).send({ title: "sub" });
        await request(app)
            .patch(`/api/subtasks/${subtask.body.id}`)
            .send({ status: "WIP", branchName: "feature/x" });
        await request(app)
            .patch(`/api/subtasks/${subtask.body.id}`)
            .send({ status: "IN_PR", prUrl: "https://github.com/org/checkout-web/pull/1" });

        const response = await request(app).get("/api/calendar");
        expect(response.status).toBe(200);
        const entry = response.body.find((e: { sprintId: number }) => e.sprintId === sprint.body.id);
        expect(entry.repos).toEqual(["checkout-web"]);
    });

    it("filters by repo query param", async () => {
        await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const response = await request(app).get("/api/calendar?repo=nonexistent-repo");
        expect(response.body).toEqual([]);
    });
});
