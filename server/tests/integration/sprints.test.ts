import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();

describe("GET /api/sprints", () => {
    it("lists sprints, newest first", async () => {
        await request(app).post("/api/sprints").send({ name: "Older", startDate: "2026-01-01" });
        await request(app).post("/api/sprints").send({ name: "Newer", startDate: "2026-02-01" });

        const response = await request(app).get("/api/sprints");
        expect(response.status).toBe(200);
        expect(response.body.map((sprint: { name: string }) => sprint.name)).toEqual(["Newer", "Older"]);
    });
});

describe("POST /api/sprints", () => {
    it("creates a sprint and returns 201", async () => {
        const response = await request(app)
            .post("/api/sprints")
            .send({ name: "Sprint 1", startDate: "2026-01-01", comment: "kickoff" });
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({ name: "Sprint 1", startDate: "2026-01-01", comment: "kickoff" });
    });

    it("rejects a missing name or startDate with 400", async () => {
        const response = await request(app).post("/api/sprints").send({ name: "No start date" });
        expect(response.status).toBe(400);
        expect(response.body.error).toBeTruthy();
    });
});

describe("GET /api/sprints/:id", () => {
    it("fetches a single sprint with its stories", async () => {
        const created = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const response = await request(app).get(`/api/sprints/${created.body.id}`);
        expect(response.status).toBe(200);
        expect(response.body.stories).toEqual([]);
    });

    it("404s for a missing sprint", async () => {
        const response = await request(app).get("/api/sprints/999999");
        expect(response.status).toBe(404);
    });
});

describe("PATCH /api/sprints/:id", () => {
    it("updates the sprint's comment", async () => {
        const created = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const response = await request(app).patch(`/api/sprints/${created.body.id}`).send({ comment: "updated" });
        expect(response.status).toBe(200);
        expect(response.body.comment).toBe("updated");
    });
});

describe("POST /api/sprints/:id/stories", () => {
    it("creates a story under the sprint", async () => {
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const response = await request(app)
            .post(`/api/sprints/${sprint.body.id}/stories`)
            .send({ jiraUrl: "https://nebula.atlassian.net/browse/NEB-1", description: "a story" });
        expect(response.status).toBe(201);
        expect(response.body.jiraKey).toBe("NEB-1");
        expect(response.body.sprintId).toBe(sprint.body.id);
    });

    it("rejects a missing jiraUrl or description with 400", async () => {
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const response = await request(app).post(`/api/sprints/${sprint.body.id}/stories`).send({});
        expect(response.status).toBe(400);
    });
});
