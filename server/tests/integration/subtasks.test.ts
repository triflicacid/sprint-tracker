import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();
let storyId: number;

beforeEach(async () => {
    const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
    const story = await request(app)
        .post(`/api/sprints/${sprint.body.id}/stories`)
        .send({ jiraUrl: "https://x/browse/NEB-1", description: "story" });
    storyId = story.body.id;
});

async function createSubtask(): Promise<{ id: number }> {
    const response = await request(app).post(`/api/stories/${storyId}/subtasks`).send({ title: "sub" });
    return response.body;
}

async function createSubtaskWithType(type: string): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await request(app).post(`/api/stories/${storyId}/subtasks`).send({ title: "sub", type });
    return { status: response.status, body: response.body };
}

describe("GET /api/subtasks/:id", () => {
    it("fetches a subtask", async () => {
        const subtask = await createSubtask();
        const response = await request(app).get(`/api/subtasks/${subtask.id}`);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("NEW");
    });

    it("includes a type field on the returned subtask", async () => {
        const subtask = await createSubtask();
        const response = await request(app).get(`/api/subtasks/${subtask.id}`);
        expect(response.status).toBe(200);
        expect(response.body.type).toBe("unknown");
    });

    it("404s for a missing subtask", async () => {
        const response = await request(app).get("/api/subtasks/999999");
        expect(response.status).toBe(404);
    });
});

describe("POST /api/stories/:id/subtasks - type field", () => {
    it("defaults to 'unknown' when no type is provided", async () => {
        const { body } = await createSubtaskWithType("unknown");
        // already tested via createSubtask, but confirm explicitly
        const response = await request(app).post(`/api/stories/${storyId}/subtasks`).send({ title: "no type" });
        expect(response.status).toBe(201);
        expect(response.body.type).toBe("unknown");
    });

    it("stores the given type when a valid type is supplied", async () => {
        const response = await request(app)
            .post(`/api/stories/${storyId}/subtasks`)
            .send({ title: "feature work", type: "feature" });
        expect(response.status).toBe(201);
        expect(response.body.type).toBe("feature");
    });

    it("stores tech-debt (hyphenated) type correctly", async () => {
        const response = await request(app)
            .post(`/api/stories/${storyId}/subtasks`)
            .send({ title: "cleanup", type: "tech-debt" });
        expect(response.status).toBe(201);
        expect(response.body.type).toBe("tech-debt");
    });

    it("rejects an unrecognised type with 400", async () => {
        const response = await request(app)
            .post(`/api/stories/${storyId}/subtasks`)
            .send({ title: "bad", type: "not-real" });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid subtask type/i);
    });

    it("does not create the subtask when the type is invalid", async () => {
        await request(app).post(`/api/stories/${storyId}/subtasks`).send({ title: "bad", type: "nope" });
        const story = await request(app).get(`/api/stories/${storyId}`);
        expect(story.body.subtasks).toHaveLength(0);
    });
});

describe("GET /api/subtasks/:id/history", () => {
    it("starts with a single NEW entry on creation", async () => {
        const subtask = await createSubtask();
        const response = await request(app).get(`/api/subtasks/${subtask.id}/history`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].status).toBe("NEW");
    });
});

describe("PATCH /api/subtasks/:id - full lifecycle", () => {
    it("walks a subtask through the whole flow to DONE, recording history at each step", async () => {
        const subtask = await createSubtask();

        const toWip = await request(app)
            .patch(`/api/subtasks/${subtask.id}`)
            .send({ status: "WIP", branchName: "feature/x" });
        expect(toWip.status).toBe(200);
        expect(toWip.body.branchName).toBe("feature/x");

        const toInReview = await request(app)
            .patch(`/api/subtasks/${subtask.id}`)
            .send({ status: "IN_REVIEW", prUrl: "https://github.com/org/repo/pull/1" });
        expect(toInReview.status).toBe(200);
        expect(toInReview.body.repoName).toBe("repo");

        const toCutRelease = await request(app).patch(`/api/subtasks/${subtask.id}`).send({ status: "CUT_RELEASE" });
        expect(toCutRelease.status).toBe(200);

        const toTesting = await request(app)
            .patch(`/api/subtasks/${subtask.id}`)
            .send({ status: "TESTING", releaseVersion: "v1.0.0" });
        expect(toTesting.status).toBe(200);

        const toUat = await request(app).patch(`/api/subtasks/${subtask.id}`).send({ status: "UAT" });
        expect(toUat.status).toBe(200);

        const toDone = await request(app).patch(`/api/subtasks/${subtask.id}`).send({ status: "DONE" });
        expect(toDone.status).toBe(200);
        expect(toDone.body.status).toBe("DONE");

        const history = await request(app).get(`/api/subtasks/${subtask.id}/history`);
        expect(history.body.map((entry: { status: string }) => entry.status)).toEqual([
            "NEW",
            "WIP",
            "IN_REVIEW",
            "CUT_RELEASE",
            "TESTING",
            "UAT",
            "DONE",
        ]);
    });

    it("rejects an illegal transition with 400", async () => {
        const subtask = await createSubtask();
        const response = await request(app).patch(`/api/subtasks/${subtask.id}`).send({ status: "DONE" });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/cannot move from NEW to DONE/i);
    });

    it("rejects a transition missing its required field with 400", async () => {
        const subtask = await createSubtask();
        const response = await request(app).patch(`/api/subtasks/${subtask.id}`).send({ status: "WIP" });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/branch name is required/i);
    });

    it("updates complexity rating without requiring a status", async () => {
        const subtask = await createSubtask();
        const response = await request(app).patch(`/api/subtasks/${subtask.id}`).send({ complexityRating: 5 });
        expect(response.status).toBe(200);
        expect(response.body.complexityRating).toBe(5);
    });

    it("updates the comment without requiring a status", async () => {
        const subtask = await createSubtask();
        const response = await request(app).patch(`/api/subtasks/${subtask.id}`).send({ comment: "watch out for X" });
        expect(response.status).toBe(200);
        expect(response.body.comment).toBe("watch out for X");
        expect(response.body.title).toBe("sub");
    });

    it("clears the comment when updated to an empty string", async () => {
        const subtask = await createSubtask();
        await request(app).patch(`/api/subtasks/${subtask.id}`).send({ comment: "temporary" });
        const response = await request(app).patch(`/api/subtasks/${subtask.id}`).send({ comment: "" });
        expect(response.status).toBe(200);
        expect(response.body.comment).toBe("");
    });

    it("rejects changing complexity rating over the API once a subtask has reached cut release", async () => {
        const subtask = await createSubtask();
        await request(app).patch(`/api/subtasks/${subtask.id}`).send({ status: "WIP", branchName: "feature/x" });
        await request(app)
            .patch(`/api/subtasks/${subtask.id}`)
            .send({ status: "IN_REVIEW", prUrl: "https://github.com/org/repo/pull/1" });
        await request(app).patch(`/api/subtasks/${subtask.id}`).send({ status: "CUT_RELEASE" });

        const response = await request(app).patch(`/api/subtasks/${subtask.id}`).send({ complexityRating: 5 });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/cannot change complexity/i);

        // and confirm it wasn't persisted
        const fetched = await request(app).get(`/api/subtasks/${subtask.id}`);
        expect(fetched.body.complexityRating).toBeNull();
    });
});
