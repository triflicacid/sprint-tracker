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

    it("rejects a missing name or start date with 400", async () => {
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

describe("PATCH /api/sprints/:id/lock", () => {
    it("locks and unlocks a sprint", async () => {
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const locked = await request(app).patch(`/api/sprints/${sprint.body.id}/lock`).send({ locked: true });
        expect(locked.status).toBe(200);
        expect(locked.body.locked).toBe(true);

        const unlocked = await request(app).patch(`/api/sprints/${sprint.body.id}/lock`).send({ locked: false });
        expect(unlocked.status).toBe(200);
        expect(unlocked.body.locked).toBe(false);
    });

    it("blocks further mutation while a sprint is manually locked", async () => {
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        await request(app).patch(`/api/sprints/${sprint.body.id}/lock`).send({ locked: true });

        const response = await request(app).patch(`/api/sprints/${sprint.body.id}`).send({ comment: "too late" });
        expect(response.status).toBe(409);
        expect(response.body.error).toBeTruthy();
    });

    it("cascades: locking a sprint blocks story and subtask mutation too", async () => {
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const story = await request(app)
            .post(`/api/sprints/${sprint.body.id}/stories`)
            .send({ jiraUrl: "https://x/browse/NEB-1", description: "story" });
        const subtask = await request(app).post(`/api/stories/${story.body.id}/subtasks`).send({ title: "sub" });

        await request(app).patch(`/api/sprints/${sprint.body.id}/lock`).send({ locked: true });

        const storyUpdate = await request(app).patch(`/api/stories/${story.body.id}`).send({ storyPoints: 5 });
        expect(storyUpdate.status).toBe(409);

        const subtaskUpdate = await request(app)
            .patch(`/api/subtasks/${subtask.body.id}`)
            .send({ comment: "blocked" });
        expect(subtaskUpdate.status).toBe(409);

        const newSubtask = await request(app).post(`/api/stories/${story.body.id}/subtasks`).send({ title: "another" });
        expect(newSubtask.status).toBe(409);
    });

    it("404s for a missing sprint", async () => {
        const response = await request(app).patch("/api/sprints/999999/lock").send({ locked: true });
        expect(response.status).toBe(404);
    });

    it("rejects locking on a sprint once it has ended, but still allows unlocking", async () => {
        const sprint = await request(app)
            .post("/api/sprints")
            .send({ name: "Sprint", startDate: "2026-01-01", endDate: "2099-01-01" });
        await request(app).patch(`/api/sprints/${sprint.body.id}`).send({ endDate: "2020-01-10" });

        const lockOn = await request(app).patch(`/api/sprints/${sprint.body.id}/lock`).send({ locked: true });
        expect(lockOn.status).toBe(409);

        const unlock = await request(app).patch(`/api/sprints/${sprint.body.id}/lock`).send({ locked: false });
        expect(unlock.status).toBe(200);
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

    it("rejects a missing jira url or description with 400", async () => {
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const response = await request(app).post(`/api/sprints/${sprint.body.id}/stories`).send({});
        expect(response.status).toBe(400);
    });
});
