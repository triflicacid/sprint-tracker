import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();
let sprintId: number;
let storyId: number;

beforeEach(async () => {
    const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01", endDate: "2026-01-10" });
    sprintId = sprint.body.id;
    const story = await request(app)
        .post(`/api/sprints/${sprintId}/stories`)
        .send({ jiraUrl: "https://x/browse/NEB-1", description: "story" });
    storyId = story.body.id;
});

describe("GET /api/stats/sprint/:id", () => {
    it("returns sprint-level stats", async () => {
        const response = await request(app).get(`/api/stats/sprint/${sprintId}`);
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ sprintId, storyCount: 1, prCount: 0 });
    });
});

describe("GET /api/stats/status-breakdown/:id", () => {
    it("defaults to subtask granularity", async () => {
        const response = await request(app).get(`/api/stats/status-breakdown/${sprintId}`);
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].counts).toHaveProperty("NEW");
    });

    it("switches to story granularity via query param", async () => {
        const response = await request(app).get(`/api/stats/status-breakdown/${sprintId}?granularity=story`);
        expect(response.body[0].counts).toHaveProperty("JIRA_ONLY");
    });
});

describe("GET /api/stats/day-activity/:id", () => {
    it("returns an empty map when nothing has started", async () => {
        const response = await request(app).get(`/api/stats/day-activity/${sprintId}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    it("includes active days once a subtask starts moving", async () => {
        // this sprint's fixed 2026-01-01..01-10 range won't contain the real
        // "now" timestamp a live PATCH records to status_history, so this
        // test uses its own open-ended (ongoing) sprint that does.
        const ongoing = await request(app).post("/api/sprints").send({ name: "Ongoing", startDate: "2020-01-01" });
        const story = await request(app)
            .post(`/api/sprints/${ongoing.body.id}/stories`)
            .send({ jiraUrl: "https://x/browse/NEB-2", description: "story" });
        const subtask = await request(app).post(`/api/stories/${story.body.id}/subtasks`).send({ title: "sub" });
        await request(app).patch(`/api/subtasks/${subtask.body.id}`).send({ status: "WIP", branchName: "feature/x" });

        const response = await request(app).get(`/api/stats/day-activity/${ongoing.body.id}`);
        const dates = Object.keys(response.body);
        expect(dates.length).toBeGreaterThan(0);
    });
});
