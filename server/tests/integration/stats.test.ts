import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();
let sprintId: number;
let storyId: number;

// fixture sprint must stay unlocked (endDate in the future) so its stories/
// subtasks remain mutable, but well before the 2030 range used below.
function fixtureEndDate() {
    const date = new Date();
    date.setDate(date.getDate() + 180);
    return date.toISOString().slice(0, 10);
}

beforeEach(async () => {
    const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01", endDate: fixtureEndDate() });
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

describe("GET /api/stats/velocity/:id", () => {
    it("defaults to mode=all, including the given sprint", async () => {
        const response = await request(app).get(`/api/stats/velocity/${sprintId}`);
        expect(response.status).toBe(200);
        expect(response.body.map((point: { sprintId: number }) => point.sprintId)).toContain(sprintId);
    });

    it("mode=lastN with n=1 returns just the given sprint", async () => {
        const response = await request(app).get(`/api/stats/velocity/${sprintId}?mode=lastN&n=1`);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].sprintId).toBe(sprintId);
    });

    it("mode=range excludes sprints outside the given from/to", async () => {
        const response = await request(app).get(
            `/api/stats/velocity/${sprintId}?mode=range&from=2030-01-01&to=2030-12-31`
        );
        expect(response.body.map((point: { sprintId: number }) => point.sprintId)).not.toContain(sprintId);
    });

    it("sums completed story points once a story's subtasks are DONE", async () => {
        await request(app).patch(`/api/stories/${storyId}`).send({ storyPoints: 5 });
        const subtask = await request(app).post(`/api/stories/${storyId}/subtasks`).send({ title: "sub" });
        const subtaskId = subtask.body.id;
        await request(app).patch(`/api/subtasks/${subtaskId}`).send({ status: "WIP", branchName: "feature/x" });
        await request(app)
            .patch(`/api/subtasks/${subtaskId}`)
            .send({ status: "IN_REVIEW", prUrl: "https://github.com/org/repo/pull/1" });
        await request(app).patch(`/api/subtasks/${subtaskId}`).send({ status: "CUT_RELEASE" });
        await request(app).patch(`/api/subtasks/${subtaskId}`).send({ status: "TESTING", releaseVersion: "v1.0.0" });
        await request(app).patch(`/api/subtasks/${subtaskId}`).send({ status: "UAT" });
        await request(app).patch(`/api/subtasks/${subtaskId}`).send({ status: "DONE" });

        const response = await request(app).get(`/api/stats/velocity/${sprintId}?mode=lastN&n=1`);
        expect(response.body[0]).toMatchObject({ completedPoints: 5, completedStoryCount: 1, unpointedDoneStoryCount: 0 });
    });
});

describe("GET /api/stats/day-activity", () => {
    it("returns an empty map when nothing has started", async () => {
        const response = await request(app).get("/api/stats/day-activity");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    it("includes active days across every sprint, not just one", async () => {
        const subtask = await request(app).post(`/api/stories/${storyId}/subtasks`).send({ title: "sub" });
        await request(app).patch(`/api/subtasks/${subtask.body.id}`).send({ status: "WIP", branchName: "feature/x" });

        const response = await request(app).get("/api/stats/day-activity");
        const dates = Object.keys(response.body);
        expect(dates.length).toBeGreaterThan(0);
    });
});

describe("GET /api/stats/day-activity/:id", () => {
    it("returns an empty map when nothing has started", async () => {
        const response = await request(app).get(`/api/stats/day-activity/${sprintId}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    it("includes active days once a subtask starts moving", async () => {
        // this sprint's fixed date range won't contain the real "now"
        // timestamp a live PATCH records to status_history, so this test
        // uses its own open-ended (ongoing) sprint that does.
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
