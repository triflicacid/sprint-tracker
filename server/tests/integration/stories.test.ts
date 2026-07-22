import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();
let sprintId: number;

beforeEach(async () => {
    const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
    sprintId = sprint.body.id;
});

async function createStory(): Promise<{ id: number }> {
    const response = await request(app)
        .post(`/api/sprints/${sprintId}/stories`)
        .send({ jiraUrl: "https://nebula.atlassian.net/browse/NEB-1", description: "a story" });
    return response.body;
}

describe("GET /api/stories/:id", () => {
    it("fetches a story with its subtasks", async () => {
        const story = await createStory();
        const response = await request(app).get(`/api/stories/${story.id}`);
        expect(response.status).toBe(200);
        expect(response.body.subtasks).toEqual([]);
    });

    it("404s for a missing story", async () => {
        const response = await request(app).get("/api/stories/999999");
        expect(response.status).toBe(404);
    });
});

describe("PATCH /api/stories/:id", () => {
    it("updates awaiting more subtasks", async () => {
        const story = await createStory();
        const response = await request(app).patch(`/api/stories/${story.id}`).send({ awaitingMoreSubtasks: true });
        expect(response.status).toBe(200);
        expect(response.body.awaitingMoreSubtasks).toBe(true);
    });

    it("updates story points", async () => {
        const story = await createStory();
        const response = await request(app).patch(`/api/stories/${story.id}`).send({ storyPoints: 8 });
        expect(response.status).toBe(200);
        expect(response.body.storyPoints).toBe(8);
    });

    it("updates awaiting more subtasks and story points independently, leaving the other field untouched", async () => {
        const story = await createStory();
        await request(app).patch(`/api/stories/${story.id}`).send({ storyPoints: 5 });
        const response = await request(app).patch(`/api/stories/${story.id}`).send({ awaitingMoreSubtasks: true });
        expect(response.body.awaitingMoreSubtasks).toBe(true);
        expect(response.body.storyPoints).toBe(5);
    });

    it("404s for a missing story", async () => {
        const response = await request(app).patch("/api/stories/999999").send({ awaitingMoreSubtasks: true });
        expect(response.status).toBe(404);
    });
});

describe("POST /api/stories/:id/subtasks", () => {
    it("creates a subtask under the story", async () => {
        const story = await createStory();
        const response = await request(app)
            .post(`/api/stories/${story.id}/subtasks`)
            .send({ title: "add endpoint" });
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({ status: "NEW", storyId: story.id, title: "add endpoint", comment: null });
    });

    it("rejects a missing title with 400", async () => {
        const story = await createStory();
        const response = await request(app).post(`/api/stories/${story.id}/subtasks`).send({});
        expect(response.status).toBe(400);
    });
});

describe("story tags", () => {
    it("adds and lists a custom tag", async () => {
        const story = await createStory();
        const added = await request(app).post(`/api/stories/${story.id}/tags`).send({ name: "urgent" });
        expect(added.status).toBe(201);

        const listed = await request(app).get(`/api/stories/${story.id}/tags`);
        expect(listed.body.map((tag: { name: string }) => tag.name)).toEqual(["urgent"]);
    });

    it("removes a tag", async () => {
        const story = await createStory();
        const added = await request(app).post(`/api/stories/${story.id}/tags`).send({ name: "urgent" });
        const removed = await request(app).delete(`/api/stories/${story.id}/tags/${added.body.id}`);
        expect(removed.status).toBe(204);

        const listed = await request(app).get(`/api/stories/${story.id}/tags`);
        expect(listed.body).toEqual([]);
    });

    it("rejects a missing tag name with 400", async () => {
        const story = await createStory();
        const response = await request(app).post(`/api/stories/${story.id}/tags`).send({});
        expect(response.status).toBe(400);
    });
});
