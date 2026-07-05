import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();

describe("GET /api/tags", () => {
    it("lists every tag across all entities", async () => {
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const story = await request(app)
            .post(`/api/sprints/${sprint.body.id}/stories`)
            .send({ jiraUrl: "https://x/browse/NEB-1", description: "story" });
        await request(app).post(`/api/stories/${story.body.id}/tags`).send({ name: "urgent" });

        const response = await request(app).get("/api/tags");
        expect(response.status).toBe(200);
        expect(response.body.map((tag: { name: string }) => tag.name)).toEqual(["urgent"]);
    });

    it("returns an empty list when no tags exist", async () => {
        const response = await request(app).get("/api/tags");
        expect(response.body).toEqual([]);
    });
});
