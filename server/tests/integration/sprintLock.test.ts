import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();

function offsetFromToday(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

async function buildFixture(endDate: string | null) {
    const sprint = await request(app)
        .post("/api/sprints")
        .send({ name: "Sprint 1", startDate: "2026-01-01", endDate });
    const sprintId: number = sprint.body.id;

    const story = await request(app)
        .post(`/api/sprints/${sprintId}/stories`)
        .send({ jiraUrl: "https://x/browse/NEB-1", description: "story" });
    const storyId: number = story.body.id;

    const subtask = await request(app).post(`/api/stories/${storyId}/subtasks`).send({ title: "sub" });
    const subtaskId: number = subtask.body.id;

    const tag = await request(app).post(`/api/stories/${storyId}/tags`).send({ name: "urgent" });
    const tagId: number = tag.body.id;

    return { sprintId, storyId, subtaskId, tagId };
}

describe("mutating a locked (past end date) sprint", () => {
    it("rejects every mutating route with 409, leaving the underlying data unchanged", async () => {
        // build the fixture while the sprint is still open, then lock it -
        // mirrors the real lifecycle of a sprint ending after it has content
        const { sprintId, storyId, subtaskId, tagId } = await buildFixture(offsetFromToday(30));
        const lockResponse = await request(app)
            .patch(`/api/sprints/${sprintId}`)
            .send({ endDate: offsetFromToday(-1) });
        expect(lockResponse.status).toBe(200);

        const attempts = [
            request(app).patch(`/api/sprints/${sprintId}`).send({ comment: "edited after lock" }),
            request(app)
                .post(`/api/sprints/${sprintId}/stories`)
                .send({ jiraUrl: "https://x/browse/NEB-2", description: "another story" }),
            request(app).patch(`/api/stories/${storyId}`).send({ storyPoints: 3 }),
            request(app).post(`/api/stories/${storyId}/subtasks`).send({ title: "another sub" }),
            request(app).patch(`/api/subtasks/${subtaskId}`).send({ comment: "edited after lock" }),
            request(app).post(`/api/stories/${storyId}/tags`).send({ name: "another-tag" }),
            request(app).delete(`/api/stories/${storyId}/tags/${tagId}`),
        ];

        for (const attempt of attempts) {
            const response = await attempt;
            expect(response.status).toBe(409);
            expect(response.body.error).toBeTruthy();
        }

        const story = await request(app).get(`/api/stories/${storyId}`);
        expect(story.body.storyPoints).toBeNull();
        const subtask = await request(app).get(`/api/subtasks/${subtaskId}`);
        expect(subtask.body.comment).toBeNull();
        const tags = await request(app).get(`/api/stories/${storyId}/tags`);
        expect(tags.body.map((tag: { name: string }) => tag.name)).toEqual(["urgent"]);
    });
});

describe("mutating an unlocked sprint", () => {
    it("still allows every mutating route when end date is null (open-ended)", async () => {
        const { sprintId, storyId, subtaskId, tagId } = await buildFixture(null);

        expect((await request(app).patch(`/api/sprints/${sprintId}`).send({ comment: "still editable" })).status).toBe(
            200
        );
        expect(
            (
                await request(app)
                    .post(`/api/sprints/${sprintId}/stories`)
                    .send({ jiraUrl: "https://x/browse/NEB-2", description: "another story" })
            ).status
        ).toBe(201);
        expect((await request(app).patch(`/api/stories/${storyId}`).send({ storyPoints: 3 })).status).toBe(200);
        expect(
            (await request(app).post(`/api/stories/${storyId}/subtasks`).send({ title: "another sub" })).status
        ).toBe(201);
        expect(
            (await request(app).patch(`/api/subtasks/${subtaskId}`).send({ comment: "still editable" })).status
        ).toBe(200);
        expect((await request(app).post(`/api/stories/${storyId}/tags`).send({ name: "another-tag" })).status).toBe(
            201
        );
        expect((await request(app).delete(`/api/stories/${storyId}/tags/${tagId}`)).status).toBe(204);
    });

    it("still allows every mutating route when end date is in the future", async () => {
        const { sprintId, storyId, subtaskId, tagId } = await buildFixture(offsetFromToday(30));

        expect((await request(app).patch(`/api/sprints/${sprintId}`).send({ comment: "still editable" })).status).toBe(
            200
        );
        expect((await request(app).patch(`/api/stories/${storyId}`).send({ storyPoints: 3 })).status).toBe(200);
        expect(
            (await request(app).patch(`/api/subtasks/${subtaskId}`).send({ comment: "still editable" })).status
        ).toBe(200);
        expect((await request(app).delete(`/api/stories/${storyId}/tags/${tagId}`)).status).toBe(204);
    });

    it("is not yet locked on the day it ends", async () => {
        const { sprintId } = await buildFixture(offsetFromToday(0));
        const response = await request(app).patch(`/api/sprints/${sprintId}`).send({ comment: "last day" });
        expect(response.status).toBe(200);
    });
});
