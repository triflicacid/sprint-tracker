import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../services/jiraService.js", () => ({
    fetchJiraInfo: vi.fn(),
}));

const { fetchJiraInfo } = await import("../../services/jiraService.js");
const { createApp } = await import("../../app.js");

const app = createApp();

beforeEach(() => {
    vi.mocked(fetchJiraInfo).mockReset();
});

describe("GET /api/jira/:key", () => {
    it("404s when jira info isn't available", async () => {
        vi.mocked(fetchJiraInfo).mockResolvedValue(null);
        const response = await request(app).get("/api/jira/NEB-1");
        expect(response.status).toBe(404);
    });

    it("returns the fetched jira info", async () => {
        vi.mocked(fetchJiraInfo).mockResolvedValue({ key: "NEB-1", title: "A story", labels: ["payments"] });
        const response = await request(app).get("/api/jira/NEB-1");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ key: "NEB-1", title: "A story", labels: ["payments"] });
    });

    it("caches the result onto the story when story id is given", async () => {
        vi.mocked(fetchJiraInfo).mockResolvedValue({ key: "NEB-1", title: "A story", labels: ["payments"] });
        const sprint = await request(app).post("/api/sprints").send({ name: "Sprint 1", startDate: "2026-01-01" });
        const story = await request(app)
            .post(`/api/sprints/${sprint.body.id}/stories`)
            .send({ jiraUrl: "https://x/browse/NEB-1", description: "d" });

        await request(app).get(`/api/jira/NEB-1?storyId=${story.body.id}`);

        const reloaded = await request(app).get(`/api/stories/${story.body.id}`);
        expect(reloaded.body.jiraTitle).toBe("A story");
        expect(reloaded.body.jiraLabels).toEqual(["payments"]);
    });
});
