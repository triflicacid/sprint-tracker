import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import * as searchService from "../../services/searchService.js";

const app = createApp();

async function seedSearchData() {
    const sprint = await request(app).post("/api/sprints").send({
        name: "Auth Sprint",
        startDate: "2026-01-01",
        comment: "Authentication rollout",
        project: "Nebula",
    });

    const story = await request(app)
        .post(`/api/sprints/${sprint.body.id}/stories`)
        .send({
            jiraUrl: "https://example.atlassian.net/browse/NEB-101",
            description: "Implement authentication",
        });

    const tag = await request(app).post(`/api/stories/${story.body.id}/tags`).send({ name: "security" });

    await request(app).post(`/api/stories/${story.body.id}/subtasks`).send({
        title: "Add auth middleware",
        type: "feature",
    });

    return {
        sprintId: sprint.body.id as number,
        storyId: story.body.id as number,
        tagId: tag.body.id as number,
    };
}

describe("GET /api/search", () => {
    it("returns grouped results for a valid text query", async () => {
        await seedSearchData();

        const response = await request(app).get("/api/search").query({ q: "auth" });
        expect(response.status).toBe(200);
        expect(response.body.sprints).toHaveLength(1);
        expect(response.body.stories).toHaveLength(1);
        expect(response.body.subtasks).toHaveLength(1);
    });

    it("supports repeated tagId values and tags-only searches", async () => {
        const seeded = await seedSearchData();

        const response = await request(app).get("/api/search").query({ tagId: [seeded.tagId, seeded.tagId] });
        expect(response.status).toBe(200);
        expect(response.body.sprints).toEqual([]);
        expect(response.body.stories).toHaveLength(1);
        expect(response.body.subtasks).toHaveLength(1);
    });

    it("returns empty result groups when nothing matches", async () => {
        await seedSearchData();

        const response = await request(app).get("/api/search").query({ q: "zzzz-no-match" });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ sprints: [], stories: [], subtasks: [] });
    });

    it("rejects missing criteria", async () => {
        const response = await request(app).get("/api/search");
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/provide a query/i);
    });

    it("rejects one-character query", async () => {
        const response = await request(app).get("/api/search").query({ q: "a" });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/at least 2 characters/i);
    });

    it("rejects unknown entity values", async () => {
        const response = await request(app).get("/api/search").query({ q: "auth", entities: "story,invalid" });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid entity/i);
    });

    it("rejects malformed and unknown tag ids", async () => {
        const seeded = await seedSearchData();

        const malformed = await request(app).get("/api/search").query({ q: "auth", tagId: "abc" });
        expect(malformed.status).toBe(400);
        expect(malformed.body.error).toMatch(/positive integer/i);

        const unknown = await request(app).get("/api/search").query({ q: "auth", tagId: seeded.tagId + 999 });
        expect(unknown.status).toBe(400);
        expect(unknown.body.error).toMatch(/unknown/i);
    });

    it("rejects invalid storyId and subtaskType", async () => {
        const badStoryId = await request(app).get("/api/search").query({ q: "auth", storyId: "0" });
        expect(badStoryId.status).toBe(400);
        expect(badStoryId.body.error).toMatch(/storyId/i);

        const badSubtaskType = await request(app).get("/api/search").query({ q: "auth", subtaskType: "not-real" });
        expect(badSubtaskType.status).toBe(400);
        expect(badSubtaskType.body.error).toMatch(/invalid subtask type/i);
    });

    it("rejects unknown projects", async () => {
        await seedSearchData();

        const response = await request(app).get("/api/search").query({ q: "auth", project: "Unknown" });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/unknown project/i);
    });

    it("returns 500 when the search service throws unexpectedly", async () => {
        const spy = vi.spyOn(searchService, "search").mockImplementation(() => {
            throw new Error("boom");
        });

        try {
            const response = await request(app).get("/api/search").query({ q: "auth" });
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("internal server error");
        } finally {
            spy.mockRestore();
        }
    });
});

